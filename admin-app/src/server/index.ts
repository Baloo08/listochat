import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import systemRoutes from './routes/system.routes.js';
import tenantsRoutes from './routes/tenants.routes.js';
import billingRoutes from './routes/billing.routes.js';
import auditRoutes from './routes/audit.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint for EasyPanel / Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'betico-ops-admin', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/audit', auditRoutes);

// Static assets (Vite frontend)
app.use(express.static(__dirname));

// SPA Fallback: send index.html for any frontend route
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Betico Admin Ops: Frontend build not found. Please run build first.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Betico Ops] Servidor administrativo aislado iniciado en el puerto ${PORT}`);
  console.log(`[Betico Ops] Modo: ${process.env.NODE_ENV || 'production'}`);
});
