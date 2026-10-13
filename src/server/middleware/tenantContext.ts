import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export async function tenantContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user && req.user.tenantId) {
      req.tenantId = req.user.tenantId;
    }
    if (req.user?.role === 'superadmin') {
      const { getOrCreateSuperadminTenantId } = await import('../services/tilopay-subscription.service.js');
      req.tenantId = await getOrCreateSuperadminTenantId();
    }
  } catch (err) {
    console.warn('[tenantContext] Error resolving tenantId:', err);
  }
  next();
}

