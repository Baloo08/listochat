import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getLoyaltyProgram,
  upsertLoyaltyProgram,
  listLoyaltyCards,
  findOrCreateLoyaltyCard,
  addStamps,
  addPoints,
  redeemPoints,
  getCardTransactions,
  listPromotions,
  createPromotion,
  deletePromotion,
  listTenantVouchers,
  redeemVoucher
} from '../db/loyalty.repo.js';
import {
  getWalletConfigByTenant,
  saveWalletConfig,
  updateWalletTestStatus,
  getWalletDecryptedSecrets
} from '../db/wallet-config.repo.js';
import {
  verifyGoogleWalletCredentials,
  verifyAppleWalletCredentials
} from '../services/wallet-pass.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

// ==========================================
// PROGRAMA DE FIDELIDAD (CONFIGURACIÓN)
// ==========================================

router.get('/program', async (req, res) => {
  try {
    const program = await getLoyaltyProgram(req.tenantId!);
    res.json(program || {
      tenantId: req.tenantId,
      isActive: false,
      programType: 'points',
      currency: 'CRC',
      pointsSpendRatio: 1000,
      pointsRedeemRatio: 10,
      stampsTarget: 10,
      stampsPrize: 'Premio de lealtad',
      minSpendPerStamp: 0
    });
  } catch (error) {
    console.error('[LoyaltyRoutes] Error fetching program:', error);
    res.status(500).json({ error: 'Error al obtener programa de fidelidad' });
  }
});

router.put('/program', async (req, res) => {
  try {
    const updated = await upsertLoyaltyProgram(req.tenantId!, req.body);
    res.json(updated);
  } catch (error) {
    console.error('[LoyaltyRoutes] Error saving program:', error);
    res.status(500).json({ error: 'Error al guardar programa de fidelidad' });
  }
});

// ==========================================
// TARJETAS DE CLIENTES
// ==========================================

router.get('/cards', async (req, res) => {
  try {
    const { search, status, limit, offset } = req.query;
    const result = await listLoyaltyCards(req.tenantId!, {
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 50,
      offset: offset ? parseInt(String(offset), 10) : 0
    });
    res.json(result);
  } catch (error) {
    console.error('[LoyaltyRoutes] Error listing cards:', error);
    res.status(500).json({ error: 'Error al listar tarjetas de fidelidad' });
  }
});

router.post('/cards', async (req, res) => {
  try {
    const { identification, customerName, customerPhone } = req.body;
    if (!identification || !customerName) {
      res.status(400).json({ error: 'Cédula y nombre son requeridos' });
      return;
    }
    const card = await findOrCreateLoyaltyCard(req.tenantId!, {
      identification,
      customerName,
      customerPhone
    });
    res.json(card);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error creating card:', error);
    res.status(400).json({ error: error.message || 'Error al crear tarjeta' });
  }
});

router.post('/cards/:id/stamp', async (req, res) => {
  try {
    const { stampsCount = 1, notes } = req.body;
    const result = await addStamps(req.tenantId!, req.params.id, Number(stampsCount) || 1, {
      notes: notes || 'Sello asignado en caja',
      createdBy: (req as any).user?.userId || 'admin'
    });
    res.json(result);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error stamping card:', error);
    res.status(400).json({ error: error.message || 'Error al otorgar sello' });
  }
});

router.post('/cards/:id/points', async (req, res) => {
  try {
    const { points, action = 'add', notes } = req.body;
    const numPoints = Number(points);
    if (!numPoints || numPoints <= 0) {
      res.status(400).json({ error: 'Cantidad de puntos inválida' });
      return;
    }

    let card;
    if (action === 'redeem') {
      card = await redeemPoints(req.tenantId!, req.params.id, numPoints, {
        notes: notes || 'Canje de puntos en caja',
        createdBy: (req as any).user?.userId || 'admin'
      });
    } else {
      card = await addPoints(req.tenantId!, req.params.id, numPoints, {
        notes: notes || 'Puntos asignados en caja',
        createdBy: (req as any).user?.userId || 'admin'
      });
    }
    res.json(card);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error adjusting points:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar puntos' });
  }
});

router.get('/cards/:id/transactions', async (req, res) => {
  try {
    const txs = await getCardTransactions(req.tenantId!, req.params.id);
    res.json(txs);
  } catch (error) {
    console.error('[LoyaltyRoutes] Error fetching card transactions:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// ==========================================
// PROMOCIONES
// ==========================================

router.get('/promotions', async (req, res) => {
  try {
    const promos = await listPromotions(req.tenantId!);
    res.json(promos);
  } catch (error) {
    console.error('[LoyaltyRoutes] Error listing promotions:', error);
    res.status(500).json({ error: 'Error al listar promociones' });
  }
});

router.post('/promotions', async (req, res) => {
  try {
    const promo = await createPromotion(req.tenantId!, req.body);
    res.json(promo);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error creating promotion:', error);
    res.status(400).json({ error: error.message || 'Error al crear promoción' });
  }
});

router.delete('/promotions/:id', async (req, res) => {
  try {
    const success = await deletePromotion(req.tenantId!, req.params.id);
    res.json({ success });
  } catch (error) {
    console.error('[LoyaltyRoutes] Error deleting promotion:', error);
    res.status(500).json({ error: 'Error al eliminar promoción' });
  }
});

// ==========================================
// VOUCHERS & PREMIOS
// ==========================================

router.get('/vouchers', async (req, res) => {
  try {
    const { status } = req.query;
    const vouchers = await listTenantVouchers(req.tenantId!, status ? String(status) : undefined);
    res.json(vouchers);
  } catch (error) {
    console.error('[LoyaltyRoutes] Error listing vouchers:', error);
    res.status(500).json({ error: 'Error al listar vouchers' });
  }
});

router.post('/vouchers/:codeOrId/redeem', async (req, res) => {
  try {
    const voucher = await redeemVoucher(req.tenantId!, req.params.codeOrId);
    res.json({ success: true, voucher });
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error redeeming voucher:', error);
    res.status(400).json({ error: error.message || 'Error al canjear voucher' });
  }
});

// ==========================================
// CONFIGURACIÓN DE BILLETERAS MÓVILES (GOOGLE WALLET Y APPLE WALLET)
// ==========================================

router.get('/wallet-config', async (req, res) => {
  try {
    const config = await getWalletConfigByTenant(req.tenantId!);
    res.json({ success: true, config });
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error al consultar wallet-config:', error);
    res.status(500).json({ error: 'Error al consultar configuración de billeteras digitales' });
  }
});

router.post('/wallet-config', upload.single('appleP12File'), async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const body = req.body || {};
    const file = req.file;

    // Si se solicita activar Google Wallet, asegurar que exista llave privada configurada
    const currentConfig = await getWalletConfigByTenant(tenantId);
    if (body.googleIsActive === true || body.googleIsActive === 'true') {
      const hasKey = currentConfig.googleHasKey || Boolean(body.googlePrivateKey || body.googleServiceAccountJson);
      if (!hasKey) {
        res.status(400).json({
          error: 'No puedes activar Google Wallet sin haber configurado y guardado primero tu llave privada RSA de la Cuenta de Servicio.'
        });
        return;
      }
    }

    if (body.appleIsActive === true || body.appleIsActive === 'true') {
      const hasCert = currentConfig.appleHasCertificate || Boolean(file?.buffer);
      if (!hasCert) {
        res.status(400).json({
          error: 'No puedes activar Apple Wallet sin haber cargado primero tu certificado .p12 oficial.'
        });
        return;
      }
    }

    const updated = await saveWalletConfig(tenantId, {
      googleIssuerId: body.googleIssuerId,
      googleClientEmail: body.googleClientEmail,
      googlePrivateKey: body.googlePrivateKey,
      googleServiceAccountJson: body.googleServiceAccountJson,
      googleIsActive: body.googleIsActive !== undefined ? (body.googleIsActive === true || body.googleIsActive === 'true') : undefined,
      applePassTypeId: body.applePassTypeId,
      appleTeamId: body.appleTeamId,
      appleP12Buffer: file?.buffer,
      appleP12Filename: file?.originalname,
      appleP12Password: body.appleP12Password,
      appleIsActive: body.appleIsActive !== undefined ? (body.appleIsActive === true || body.appleIsActive === 'true') : undefined
    });

    res.json({ success: true, config: updated });
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error al guardar wallet-config:', error);
    res.status(500).json({ error: error.message || 'Error al guardar credenciales de billeteras' });
  }
});

router.post('/wallet-config/test-google', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    let { issuerId, clientEmail, privateKey } = req.body || {};

    if (!issuerId || !clientEmail || !privateKey) {
      // Usar secretos guardados
      const secrets = await getWalletDecryptedSecrets(tenantId);
      if (secrets) {
        issuerId = issuerId || secrets.googleIssuerId;
        clientEmail = clientEmail || secrets.googleClientEmail;
        privateKey = privateKey || secrets.googlePrivateKey;
      }
    }

    const testResult = verifyGoogleWalletCredentials(issuerId, clientEmail, privateKey);
    await updateWalletTestStatus(tenantId, 'google', testResult.success, testResult.message);
    res.json(testResult);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error en test-google:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al validar credenciales de Google Wallet' });
  }
});

router.post('/wallet-config/test-apple', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    let { passTypeId, teamId, password } = req.body || {};

    let p12Buffer: Buffer | null = null;
    if (!passTypeId || !teamId) {
      const secrets = await getWalletDecryptedSecrets(tenantId);
      if (secrets) {
        passTypeId = passTypeId || secrets.applePassTypeId;
        teamId = teamId || secrets.appleTeamId;
        password = password || secrets.appleP12Password;
        p12Buffer = secrets.appleP12Buffer;
      }
    }

    const testResult = verifyAppleWalletCredentials(passTypeId, teamId, p12Buffer, password);
    await updateWalletTestStatus(tenantId, 'apple', testResult.success, testResult.message);
    res.json(testResult);
  } catch (error: any) {
    console.error('[LoyaltyRoutes] Error en test-apple:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al validar credenciales de Apple Wallet' });
  }
});

export default router;
