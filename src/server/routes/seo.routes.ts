import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

// In-memory cache for sitemap XML (TTL 1 hour)
let sitemapCache: { xml: string; expiresAt: number } | null = null;
const SITEMAP_TTL_MS = 60 * 60 * 1000;

// GET /robots.txt
router.get('/robots.txt', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'betico.tech';
  const baseUrl = `${protocol}://${host}`;

  const content = `User-agent: *
Allow: /
Allow: /sitio/
Allow: /web/
Allow: /tienda/
Allow: /reservas/
Allow: /canchas/
Disallow: /admin/
Disallow: /acceso/
Disallow: /portal/
Disallow: /kds/
Disallow: /repartidor/
Disallow: /especialista/
Disallow: /colaborador/
Disallow: /equipo/
Disallow: /api/
Disallow: /subscription/
Disallow: /suscripcion/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
  res.send(content);
});

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'betico.tech';
  const baseUrl = `${protocol}://${host}`;

  if (sitemapCache && sitemapCache.expiresAt > Date.now()) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemapCache.xml);
    return;
  }

  try {
    const result = await query(`
      SELECT slug, updated_at, created_at 
      FROM tenants 
      WHERE active = true 
      ORDER BY created_at DESC
    `);

    const now = new Date().toISOString().split('T')[0];
    const tenants = result.rows;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Página Principal Betico.tech -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    for (const t of tenants) {
      if (!t.slug) continue;
      const lastMod = t.updated_at ? new Date(t.updated_at).toISOString().split('T')[0] : now;

      // 1. Sitio Web del Tenant
      xml += `  <url>
    <loc>${baseUrl}/sitio/${t.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;

      // 2. Tienda Online del Tenant
      xml += `  <url>
    <loc>${baseUrl}/tienda/${t.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;

      // 3. Reservas / Citas del Tenant
      xml += `  <url>
    <loc>${baseUrl}/reservas/${t.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

      // 4. Canchas Deportivas
      xml += `  <url>
    <loc>${baseUrl}/canchas/${t.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }

    xml += `</urlset>`;

    sitemapCache = {
      xml,
      expiresAt: Date.now() + SITEMAP_TTL_MS
    };

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('[SEO] Error generating sitemap.xml:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
