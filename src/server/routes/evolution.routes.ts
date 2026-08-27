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
    const state = rawData?.instance?.state || rawData?.state || 'disconnected';

    if (state === 'open' || state === 'connected') {
      res.json({
        status: 'connected',
        instanceName,
        whatsappNumber: tenant?.whatsappNumber
      });
      return;
    }

    // If instance is connecting or disconnected, fetch QR code
    try {
      const connectRes = await connectInstance(instanceName);
      const connectData = connectRes.data || {};
      const qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
      const pairingCode = connectData?.pairingCode || null;

      if (qrcode) {
        res.json({
          status: 'qrcode',
          qrcode,
          pairingCode,
          instanceName
        });
        return;
      }
    } catch (e) {
      // ignore
    }

    res.json({
      status: state,
      instanceName
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
    }

    // Try creating instance first (if already exists, Evolution API will return error or existing info)
    const createRes = await createInstance(instanceName);
    let qrcode = createRes.data?.qrcode?.base64 || createRes.data?.qrcode?.code || null;
    let pairingCode = createRes.data?.qrcode?.pairingCode || null;

    // If not in create, get it from connect endpoint
    if (!qrcode) {
      const connectRes = await connectInstance(instanceName);
      const connectData = connectRes.data || {};
      qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
      pairingCode = connectData?.pairingCode || null;
    }

    // Configure webhook
    try {
      const appUrl = env.APP_URL || `http://betico_app:80`;
      await setWebhook(instanceName, `${appUrl}/api/webhook/evolution`);
    } catch (e) {
      // ignore
    }

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
