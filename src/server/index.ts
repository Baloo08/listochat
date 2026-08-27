import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { runMigrations } from './db/migrations.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import servicesRoutes from './routes/services.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import chatsRoutes from './routes/chats.routes.js';
import agentRoutes from './routes/agent.routes.js';
import evolutionRoutes from './routes/evolution.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import storeRoutes from './routes/store.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import storefrontRoutes from './routes/storefront.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads
  app.use('/uploads', express.static(env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads')));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/chats', chatsRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/evolution', evolutionRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/store', storeRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/storefront', storefrontRoutes);
  app.use('/api/webhook/evolution', webhookRoutes);

  // Serve static assets in production, setup vite dev server in dev
  if (env.NODE_ENV === 'production') {
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite not available, skipping dev server middleware');
    }
  }

  // Run database migrations before starting server
  try {
    await runMigrations();
    console.log('Database migrations completed.');
  } catch (err) {
    console.error('Failed to run database migrations:', err);
    // Depending on strictness, we could process.exit(1) here
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${env.PORT}`);
  });
}

startServer().catch(console.error);
