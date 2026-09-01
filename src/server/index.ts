import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from './config/env.js';
import { runMigrations } from './db/migrations.js';
import { query } from './db/pool.js';
import { startReminderScheduler } from './services/reminder.service.js';
import { recoverInterruptedCampaigns, startScheduledCampaignScanner } from './services/campaign-queue.service.js';
import { startSubscriptionLifecycleWorker } from './services/subscription.service.js';
import { startQueueWorker } from './services/message-queue.service.js';
import { ensureQueueTable } from './db/message-queue.repo.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import usersRoutes from './routes/users.routes.js';
import servicesRoutes from './routes/services.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import chatsRoutes from './routes/chats.routes.js';
import agentRoutes from './routes/agent.routes.js';
import evolutionRoutes from './routes/evolution.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import storeRoutes from './routes/store.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditRoutes from './routes/audit.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import storefrontRoutes from './routes/storefront.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import driversRoutes from './routes/drivers.routes.js';
import superadminMetricsRoutes from './routes/superadmin-metrics.routes.js';
import superadminPlatformRoutes from './routes/superadmin-platform.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import branchesRoutes from './routes/branches.routes.js';
import specialistsRoutes from './routes/specialists.routes.js';
import websiteRoutes from './routes/website.routes.js';
import websitePublicRoutes from './routes/website-public.routes.js';
import queueRoutes from './routes/queue.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust reverse proxy headers (Nginx/Cloudflare)
  const server = http.createServer(app);

  // Setup Real-time WebSockets
  const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    socket.on('join_tenant', (tenantId: string) => {
      if (tenantId) {
        socket.join(`tenant_${tenantId}`);
      }
    });
  });

  // Attach io instance to all requests for emitting events in routes
  app.use((req, res, next) => {
    (req as any).io = io;
    next();
  });

  // Ensure upload directory exists
  const uploadPath = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Security & Performance Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Don't block external Google Fonts or Unsplash CDN images
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Rate limiters for protection against brute-force and DoS
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 20, // 20 attempts per 15 minutes per IP
    message: { error: 'Demasiados intentos de acceso fallidos. Por favor espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const publicLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false
  });

  // Auto-healing persistent uploads route (restores from PostgreSQL if container is fresh)
  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(uploadPath, filename);

      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }

      // Restore from PostgreSQL database
      const dbFile = await query('SELECT mime_type, data_base64 FROM uploaded_files WHERE filename = $1', [filename]);
      if (dbFile.rows.length > 0) {
        const { mime_type, data_base64 } = dbFile.rows[0];
        const buffer = Buffer.from(data_base64, 'base64');
        
        try {
          fs.writeFileSync(filePath, buffer);
        } catch (wErr) {
          // ignore disk cache write error
        }

        res.set('Content-Type', mime_type || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        return res.send(buffer);
      }

      res.status(404).send('Imagen no encontrada');
    } catch (err) {
      console.error('Error serving upload:', err);
      next();
    }
  });

  app.use('/uploads', express.static(uploadPath));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'Betico', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/chats', chatsRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/evolution', evolutionRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/store', storeRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/drivers', driversRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/superadmin', superadminMetricsRoutes);
  app.use('/api/superadmin/platform', superadminPlatformRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/campaigns', campaignsRoutes);
  app.use('/api/branches', branchesRoutes);
  app.use('/api/specialists', specialistsRoutes);
  app.use('/api/website-public', publicLimiter, websitePublicRoutes);
  app.use('/api/website/public', publicLimiter, websitePublicRoutes);
  app.use('/api/website', websiteRoutes);
  app.use('/api/storefront', publicLimiter, storefrontRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/webhook/evolution', webhookRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/webhook', webhookRoutes);
  app.use('/api/queue', queueRoutes);

  // Serve static assets in production, setup vite dev server in dev
  if (env.NODE_ENV === 'production') {
    app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const distDir = path.join(__dirname);
      const assetsDir = path.join(distDir, 'assets');
      
      let html = '';
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        html = fs.readFileSync(indexPath, 'utf8');
      } else {
        const fallbackPath = path.join(process.cwd(), 'dist', 'index.html');
        if (fs.existsSync(fallbackPath)) {
          html = fs.readFileSync(fallbackPath, 'utf8');
        } else {
          html = '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><div id="root"></div></body></html>';
        }
      }

      // Dynamically find the absolute newest JS bundle in assets/
      if (fs.existsSync(assetsDir)) {
        try {
          const jsFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
          if (jsFiles.length > 0) {
            jsFiles.sort((a, b) => fs.statSync(path.join(assetsDir, b)).mtimeMs - fs.statSync(path.join(assetsDir, a)).mtimeMs);
            const latestJs = jsFiles[0];
            html = html.replace(/src="\/assets\/index-[A-Za-z0-9_-]+\.js"/g, `src="/assets/${latestJs}"`);
          }
        } catch (e) {
          console.error('Error scanning assets dir:', e);
        }
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
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
    // Ensure message queue table exists
    await ensureQueueTable();
    // Start automated appointment reminder background scheduler
    startReminderScheduler();
    // Recover any active WhatsApp campaigns & start scheduled scanner
    recoverInterruptedCampaigns();
    startScheduledCampaignScanner();
    // Start subscription lifecycle worker (trial / grace period / suspension)
    startSubscriptionLifecycleWorker();
    // Start AI message queue worker
    startQueueWorker(io);
  } catch (err) {
    console.error('Failed to run database migrations:', err);
  }

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Betico Server listening on http://0.0.0.0:${env.PORT}`);
  });
}

startServer().catch(console.error);
