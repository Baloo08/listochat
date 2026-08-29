import { Redis } from 'ioredis';
import { query } from '../db/pool.js';
import { sendMessage, sendMedia } from './evolution.js';
import { getTenantById } from '../db/tenant.repo.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://betico_redis:6379';

let redis: Redis | null = null;
try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true
  });
  redis.connect().catch(() => {
    console.log('[Redis] Redis not available, using in-memory queue fallback.');
    redis = null;
  });
} catch (e) {
  redis = null;
}

interface CampaignJob {
  campaignId: string;
  tenantId: string;
  isPaused: boolean;
  isCancelled: boolean;
}

const activeJobs = new Map<string, CampaignJob>();

export async function enqueueCampaign(campaignId: string, tenantId: string): Promise<boolean> {
  if (activeJobs.has(campaignId) && !activeJobs.get(campaignId)?.isCancelled) {
    console.log(`[CampaignQueue] Campaign ${campaignId} is already running.`);
    return false;
  }

  const job: CampaignJob = {
    campaignId,
    tenantId,
    isPaused: false,
    isCancelled: false
  };

  activeJobs.set(campaignId, job);

  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, {
        status: 'sending',
        tenantId,
        startedAt: new Date().toISOString()
      });
    } catch (e) {
      // ignore
    }
  }

  // Start processing loop in background
  processCampaignJob(job);
  return true;
}

export async function pauseCampaign(campaignId: string): Promise<boolean> {
  const job = activeJobs.get(campaignId);
  if (job) {
    job.isPaused = true;
  }
  await query(`UPDATE whatsapp_campaigns SET status = 'paused' WHERE id = $1`, [campaignId]);
  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, 'status', 'paused');
    } catch (e) {}
  }
  return true;
}

export async function resumeCampaign(campaignId: string, tenantId: string): Promise<boolean> {
  let job = activeJobs.get(campaignId);
  if (job) {
    job.isPaused = false;
  } else {
    job = { campaignId, tenantId, isPaused: false, isCancelled: false };
    activeJobs.set(campaignId, job);
  }

  await query(`UPDATE whatsapp_campaigns SET status = 'sending' WHERE id = $1`, [campaignId]);
  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, 'status', 'sending');
    } catch (e) {}
  }

  processCampaignJob(job);
  return true;
}

export async function cancelCampaign(campaignId: string): Promise<boolean> {
  const job = activeJobs.get(campaignId);
  if (job) {
    job.isCancelled = true;
  }
  activeJobs.delete(campaignId);
  await query(`UPDATE whatsapp_campaigns SET status = 'cancelled' WHERE id = $1`, [campaignId]);
  if (redis) {
    try {
      await redis.del(`campaign:${campaignId}`);
    } catch (e) {}
  }
  return true;
}

async function processCampaignJob(job: CampaignJob) {
  const { campaignId, tenantId } = job;

  try {
    const campRes = await query(`SELECT * FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2`, [campaignId, tenantId]);
    if (campRes.rows.length === 0) return;

    const campaign = campRes.rows[0];
    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) return;

    // Fetch target customers
    let custQuery = `SELECT id, name, phone FROM customers WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    if (campaign.target_segment === 'tag' && campaign.target_tag) {
      custQuery += ` AND $2 = ANY(tags)`;
      params.push(campaign.target_tag);
    }
    custQuery += ` ORDER BY last_interaction DESC`;

    const customersRes = await query(custQuery, params);
    const customers = customersRes.rows;

    let sentCount = Number(campaign.sent_count || 0);
    let failedCount = Number(campaign.failed_count || 0);
    const startIndex = sentCount + failedCount;

    for (let i = startIndex; i < customers.length; i++) {
      // Check for pause or cancel signals
      if (job.isCancelled) {
        console.log(`[CampaignQueue] Campaign ${campaignId} was cancelled.`);
        return;
      }

      if (job.isPaused) {
        console.log(`[CampaignQueue] Campaign ${campaignId} is paused at index ${i}.`);
        return;
      }

      const cust = customers[i];
      const cleanPhone = cust.phone.replace(/\D/g, '');
      if (!cleanPhone) continue;

      const text = campaign.message_template
        .replace(/\{\{nombre\}\}/gi, cust.name || 'estimado cliente')
        .replace(/\{\{negocio\}\}/gi, tenant.name);

      try {
        let sendRes;
        if (campaign.media_url) {
          sendRes = await sendMedia(tenant.evolutionInstance, cleanPhone, campaign.media_url, text);
        } else {
          sendRes = await sendMessage(tenant.evolutionInstance, cleanPhone, text);
        }

        if (sendRes.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }

      // Update progress in DB every 3 sends
      if ((sentCount + failedCount) % 3 === 0 || i === customers.length - 1) {
        await query(`
          UPDATE whatsapp_campaigns 
          SET sent_count = $1, failed_count = $2 
          WHERE id = $3
        `, [sentCount, failedCount, campaignId]);

        if (redis) {
          try {
            await redis.hset(`campaign:${campaignId}`, {
              sentCount: String(sentCount),
              failedCount: String(failedCount),
              currentIndex: String(i)
            });
          } catch (e) {}
        }
      }

      // Anti-Spam / Anti-Ban throttle (3.5s delay)
      await new Promise(r => setTimeout(r, 3500));
    }

    // Mark as completed
    await query(`
      UPDATE whatsapp_campaigns 
      SET sent_count = $1, failed_count = $2, status = 'completed' 
      WHERE id = $3
    `, [sentCount, failedCount, campaignId]);

    activeJobs.delete(campaignId);
    if (redis) {
      try {
        await redis.del(`campaign:${campaignId}`);
      } catch (e) {}
    }

    console.log(`[CampaignQueue] Campaign ${campaignId} finished. Total sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error(`[CampaignQueue] Error processing campaign ${campaignId}:`, error);
    activeJobs.delete(campaignId);
  }
}

/**
 * Recovers any campaigns that were interrupted by a server restart.
 */
export async function recoverInterruptedCampaigns() {
  try {
    const interrupted = await query(`SELECT id, tenant_id as "tenantId" FROM whatsapp_campaigns WHERE status = 'sending'`);
    for (const c of interrupted.rows) {
      console.log(`[CampaignQueue] Resuming interrupted campaign ${c.id} from database state...`);
      await enqueueCampaign(c.id, c.tenantId);
    }
  } catch (err) {
    console.error('[CampaignQueue] Error recovering interrupted campaigns:', err);
  }
}
