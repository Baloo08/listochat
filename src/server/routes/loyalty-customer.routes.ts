import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  createLoyaltyCustomer,
  verifyLoyaltyCustomerLogin,
  getLoyaltyCustomerByIdentification,
  getCustomerWalletCards,
  getCustomerVouchers,
  getLoyaltyProgram,
  getLoyaltyCardByIdentification,
  getLoyaltyCardByPhone
} from '../db/loyalty.repo.js';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { query } from '../db/pool.js';

const router = Router();

// ==========================================
// AUTENTICACIÓN JWT PARA CLIENTE DE BILLETERA
// ==========================================

function signCustomerToken(customer: { id: string; identification: string; fullName: string }): string {
  return jwt.sign(
    {
      customerId: customer.id,
      identification: customer.identification,
      fullName: customer.fullName,
      role: 'loyalty_customer'
    },
    env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authenticateLoyaltyCustomer(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No autorizado. Inicia sesión en tu billetera de fidelidad.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (decoded.role !== 'loyalty_customer' || !decoded.identification) {
      res.status(403).json({ error: 'Token no válido para cliente de fidelidad.' });
      return;
    }
    (req as any).loyaltyCustomer = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Sesión expirada o inválida. Inicia sesión nuevamente.' });
  }
}

// ==========================================
// REGISTRO & INICIO DE SESIÓN
// ==========================================

router.post('/register', async (req, res) => {
  try {
    const { identification, fullName, phone, password } = req.body;
    if (!identification || !fullName || !password) {
      res.status(400).json({ error: 'Cédula, nombre completo y contraseña son requeridos' });
      return;
    }

    const existing = await getLoyaltyCustomerByIdentification(identification);
    if (existing) {
      res.status(400).json({ error: 'Ya existe una cuenta registrada con esta cédula. Inicia sesión.' });
      return;
    }

    const customer = await createLoyaltyCustomer({
      identification,
      fullName,
      phone,
      password
    });

    const token = signCustomerToken(customer);
    res.status(201).json({
      success: true,
      token,
      customer
    });
  } catch (error: any) {
    console.error('[LoyaltyCustomerRoutes] Register error:', error);
    res.status(400).json({ error: error.message || 'Error al crear cuenta' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identification, password } = req.body;
    if (!identification || !password) {
      res.status(400).json({ error: 'Cédula y contraseña requeridas' });
      return;
    }

    const customer = await verifyLoyaltyCustomerLogin(identification, password);
    if (!customer) {
      res.status(401).json({ error: 'Cédula o contraseña incorrecta' });
      return;
    }

    const token = signCustomerToken(customer);
    res.json({
      success: true,
      token,
      customer
    });
  } catch (error: any) {
    console.error('[LoyaltyCustomerRoutes] Login error:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
  }
});

// ==========================================
// BILLETERA PRIVADA DEL CLIENTE (ME)
// ==========================================

router.get('/me', authenticateLoyaltyCustomer, async (req, res) => {
  try {
    const identification = (req as any).loyaltyCustomer.identification;
    const userRow = await getLoyaltyCustomerByIdentification(identification);
    if (!userRow) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }
    res.json({
      id: userRow.id,
      identification: userRow.identification,
      fullName: userRow.full_name,
      phone: userRow.phone,
      createdAt: userRow.created_at
    });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] /me error:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.get('/me/wallet', authenticateLoyaltyCustomer, async (req, res) => {
  try {
    const identification = (req as any).loyaltyCustomer.identification;
    const cards = await getCustomerWalletCards(identification);
    res.json({ cards });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] /wallet error:', error);
    res.status(500).json({ error: 'Error al obtener tarjetas de la billetera' });
  }
});

router.get('/me/vouchers', authenticateLoyaltyCustomer, async (req, res) => {
  try {
    const identification = (req as any).loyaltyCustomer.identification;
    const vouchers = await getCustomerVouchers(identification);
    res.json({ vouchers });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] /vouchers error:', error);
    res.status(500).json({ error: 'Error al obtener recompensas' });
  }
});

// ==========================================
// CONSULTAS PÚBLICAS POR COMERCIO (/fidelidad/:slug)
// ==========================================

router.get('/public/:slug/program', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Comercio no encontrado' });
      return;
    }

    const program = await getLoyaltyProgram(tenant.id);
    res.json({
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      program: program && program.isActive ? program : null
    });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] public program error:', error);
    res.status(500).json({ error: 'Error al consultar programa' });
  }
});

router.get('/public/:slug/lookup', async (req, res) => {
  try {
    const { identification, phone } = req.query;
    if (!identification && !phone) {
      res.status(400).json({ error: 'Debes proporcionar una cédula o teléfono' });
      return;
    }

    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Comercio no encontrado' });
      return;
    }

    let card = null;
    if (identification) {
      card = await getLoyaltyCardByIdentification(tenant.id, String(identification));
    }
    if (!card && phone) {
      card = await getLoyaltyCardByPhone(tenant.id, String(phone));
    }

    const program = await getLoyaltyProgram(tenant.id);

    res.json({
      found: !!card,
      card,
      program
    });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] lookup error:', error);
    res.status(500).json({ error: 'Error al consultar tarjeta' });
  }
});

router.get('/public/voucher/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const result = await query(`
      SELECT v.*, t.name as tenant_name, t.slug as tenant_slug,
             c.customer_name, c.identification as customer_id_num
      FROM loyalty_rewards_vouchers v
      JOIN tenants t ON t.id = v.tenant_id
      JOIN loyalty_cards c ON c.id = v.card_id
      WHERE v.voucher_code = $1
    `, [code]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Cupón no encontrado' });
      return;
    }

    const v = result.rows[0];
    const isExpired = new Date(v.expires_at) < new Date();

    res.json({
      voucherCode: v.voucher_code,
      tenantName: v.tenant_name,
      tenantSlug: v.tenant_slug,
      customerName: v.customer_name,
      customerIdentification: v.customer_id_num,
      rewardDescription: v.reward_description,
      status: isExpired && v.status === 'active' ? 'expired' : v.status,
      expiresAt: v.expires_at,
      redeemedAt: v.redeemed_at
    });
  } catch (error) {
    console.error('[LoyaltyCustomerRoutes] voucher check error:', error);
    res.status(500).json({ error: 'Error al consultar voucher' });
  }
});

export default router;
