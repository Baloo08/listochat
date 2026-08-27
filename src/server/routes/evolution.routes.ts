import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getTenantById, updateTenant } from '../db/tenant.repo.js';
import { getInstanceStatus, connectInstance, disconnectInstance, createInstance, setWebhook } from '../services/evolution.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/status', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId!);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId!.slice(0, 8)}`;
    const statusRes = await getInstanceStatus(instanceName);
    const rawData = statusRes.data || {};

    // Evolution API v2 returns { instance: { state: "open"|"connecting"|"close" } }
    const state = rawData?.instance?.state || rawData?.state || 'disconnected';

    if (state === 'connecting' || state === 'close') {
      // Try to get QR code by calling connect
      try {
        const connectRes = await connectInstance(instanceName);
        const connectData = connectRes.data || {};
        const qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
        const pairingCode = connectData?.pairingCode || null;

        res.json({
          status: qrcode ? 'qrcode' : state,
          qrcode,
          pairingCode,
          instanceName
        });
        return;
      } catch (e) {
        // Fall through to return status without QR
      }
    }

    res.json({
      status: state === 'open' ? 'connected' : state,
      instanceName,
      whatsappNumber: tenant?.whatsappNumber
    });
  } catch (error) {
    res.json({ status: 'disconnected' });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId!);
    let instanceName = tenant?.evolutionInstance;

    if (!instanceName) {
      instanceName = `tenant_${req.tenantId!.slice(0, 8)}`;
      await updateTenant(req.tenantId!, { evolutionInstance: instanceName });

      // Create instance in Evolution API
      const createRes = await createInstance(instanceName);
      console.log('Instance created:', createRes.data);

      // Set webhook URL
      const appUrl = env.APP_URL || `http://betico_app:80`;
      await setWebhook(instanceName, `${appUrl}/api/webhook/evolution`);
    }

    const connectRes = await connectInstance(instanceName);
    const connectData = connectRes.data || {};

    // Extract QR code from Evolution API response
    const qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
    const pairingCode = connectData?.pairingCode || null;

    res.json({
      status: qrcode ? 'qrcode' : 'connecting',
      qrcode,
      pairingCode,
      instanceName
    });
  } catch (error) {
    console.error('Evolution connect error:', error);
    res.status(500).json({ error: 'Error conectando instancia' });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId!);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId!.slice(0, 8)}`;
    await disconnectInstance(instanceName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error desconectando instancia' });
  }
});

export default router;
