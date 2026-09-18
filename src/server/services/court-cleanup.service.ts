import { expireOldMatches, purgeOldUncompletedBookings } from '../db/courts.repo.js';

export function startCourtCleanupScheduler() {
  console.log('[CourtCleanup] Starting automated court cleanup scheduler (interval: 2 mins)...');

  // Run initial cleanup 10 seconds after startup
  setTimeout(runCourtCleanup, 10000);

  // Run periodically every 2 minutes to expire unconfirmed bookings 2h post-reservation
  setInterval(runCourtCleanup, 2 * 60 * 1000);
}

async function runCourtCleanup() {
  try {
    const expiredCount = await expireOldMatches();
    const purgedCount = await purgeOldUncompletedBookings();

    if (expiredCount > 0 || purgedCount > 0) {
      console.log(`[CourtCleanup] Cleanup run complete: ${expiredCount} reservas no pagadas tras 2h o expiradas pasaron a no concretadas, ${purgedCount} reservas no concretadas (>15 días) fueron purgadas.`);
    }
  } catch (err: any) {
    console.error('[CourtCleanup] Error running court cleanup task:', err?.message || err);
  }
}
