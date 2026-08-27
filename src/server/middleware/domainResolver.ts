import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      tenant?: any; // Replace with Tenant type when available
    }
  }
}

export async function domainResolver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const host = req.headers.host || '';
    const isCustomDomain = !host.includes(env.BASE_DOMAIN);
    
    // In a full implementation, you would query the database here:
    // If it's a custom domain: SELECT * FROM tenants WHERE custom_domain = $1
    // If it's a path-based approach like /tienda/:slug, the slug is handled in the route
    
    // For now, pass to next middleware
    next();
  } catch (error) {
    next(error);
  }
}
