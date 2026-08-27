import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getTenantById, updateTenant } from '../db/tenant.repo.js';
import { getInstanceStatus, connectInstance, disconnectInstance, createInstance } from '../services/evolution.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/status', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId.slice(0,8)}`;
    const status = await getInstanceStatus(instanceName);
    res.json(status.data || { status: 'disconnected' });
  } catch (error) {
    res.json({ status: 'disconnected' });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    let instanceName = tenant?.evolutionInstance;
    if (!instanceName) {
      instanceName = `tenant_${req.tenantId.slice(0,8)}`;
      await updateTenant(req.tenantId, { evolutionInstance: instanceName });
      await createInstance(instanceName);
    }
    const connectRes = await connectInstance(instanceName);
    res.json(connectRes.data || { success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error conectando instancia' });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId.slice(0,8)}`;
    await disconnectInstance(instanceName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error desconectando instancia' });
  }
});

export default router;
