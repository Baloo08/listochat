import test from 'node:test';
import assert from 'node:assert/strict';

// Pure SEO helper implementations for testing invariant guarantees (ISO/IEC 25010)
function toAbsoluteUrl(imagePath, baseUrl) {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return `${baseUrl}/logo.png`;
  }
  const clean = imagePath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  const pathPart = clean.startsWith('/') ? clean : `/${clean}`;
  return `${baseUrl}${pathPart}`;
}

function escapeHtmlAttr(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function inferSchemaType(category) {
  if (!category) return 'LocalBusiness';
  const c = category.toLowerCase();
  if (c.includes('barber') || c.includes('peluquer') || c.includes('salon') || c.includes('estil') || c.includes('uñas')) {
    return 'HealthAndBeautyBusiness';
  }
  if (c.includes('auto') || c.includes('taller') || c.includes('mecanic') || c.includes('detailing') || c.includes('lavado')) {
    return 'AutoRepair';
  }
  if (c.includes('comida') || c.includes('restaurante') || c.includes('soda') || c.includes('cafe') || c.includes('bar')) {
    return 'FoodEstablishment';
  }
  if (c.includes('dental') || c.includes('medico') || c.includes('salud') || c.includes('terapia') || c.includes('nutri')) {
    return 'MedicalBusiness';
  }
  if (c.includes('cancha') || c.includes('deporte') || c.includes('futbol') || c.includes('padel') || c.includes('gym')) {
    return 'SportsActivityLocation';
  }
  return 'LocalBusiness';
}

function injectSeoIntoHtml(html, meta) {
  if (!meta) return html;
  let result = html;

  if (meta.title) {
    result = result.replace(/<title>.*?<\/title>/i, `<title>${escapeHtmlAttr(meta.title)}</title>`);
  }

  const metaTags = `
    <!-- Dynamic SEO & Open Graph (SSR Injected) -->
    <meta name="description" content="${escapeHtmlAttr(meta.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" />

    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:site_name" content="${escapeHtmlAttr(meta.siteName)}" />
    <meta property="og:type" content="${escapeHtmlAttr(meta.type)}" />
    <meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />
    <meta property="og:image" content="${escapeHtmlAttr(meta.image)}" />
    <meta property="og:url" content="${escapeHtmlAttr(meta.canonicalUrl)}" />
    <meta property="og:locale" content="es_CR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(meta.image)}" />

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(meta.jsonLd, null, 2)}
    </script>
  `;

  if (result.includes('</head>')) {
    return result.replace('</head>', `${metaTags}\n</head>`);
  }
  return `${metaTags}\n${result}`;
}

function shouldBypassSeo(pathname) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/acceso') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/kds') ||
    pathname.startsWith('/repartidor') ||
    pathname.startsWith('/especialista') ||
    pathname.startsWith('/colaborador') ||
    pathname.startsWith('/equipo') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/uploads')
  );
}

function generateRobotsTxt(baseUrl) {
  return `User-agent: *
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
}

test('SEO & Open Graph Architecture Tests (Google & WhatsApp Previews)', async (t) => {
  await t.test('1. toAbsoluteUrl normalization for Open Graph', () => {
    const baseUrl = 'https://betico.tech';

    // Null / empty fallback to default logo
    assert.equal(toAbsoluteUrl(null, baseUrl), 'https://betico.tech/logo.png');
    assert.equal(toAbsoluteUrl('', baseUrl), 'https://betico.tech/logo.png');
    assert.equal(toAbsoluteUrl('   ', baseUrl), 'https://betico.tech/logo.png');

    // Relative path with leading slash
    assert.equal(toAbsoluteUrl('/uploads/banners/comhar.jpg', baseUrl), 'https://betico.tech/uploads/banners/comhar.jpg');

    // Relative path without leading slash
    assert.equal(toAbsoluteUrl('uploads/logos/barber.png', baseUrl), 'https://betico.tech/uploads/logos/barber.png');

    // Already absolute HTTPS URL remains intact
    assert.equal(toAbsoluteUrl('https://cdn.example.com/logo.png', baseUrl), 'https://cdn.example.com/logo.png');
    assert.equal(toAbsoluteUrl('http://cdn.example.com/logo.png', baseUrl), 'http://cdn.example.com/logo.png');
  });

  await t.test('2. escapeHtmlAttr sanitizes text for HTML attributes and meta tags', () => {
    assert.equal(escapeHtmlAttr(''), '');
    assert.equal(escapeHtmlAttr(null), '');

    // Quotes and dangerous tags are escaped
    const input = 'Comhar "Auto" & <Detailing>\nCortes de pelo';
    const output = escapeHtmlAttr(input);
    assert.ok(!output.includes('"'), 'Quotes must be escaped');
    assert.ok(!output.includes('<'), 'Less-than must be escaped');
    assert.ok(!output.includes('>'), 'Greater-than must be escaped');
    assert.ok(!output.includes('\n'), 'Newlines must be converted to spaces');
    assert.equal(output, 'Comhar &quot;Auto&quot; &amp; &lt;Detailing&gt; Cortes de pelo');
  });

  await t.test('3. Schema.org Category Type Inference', () => {
    assert.equal(inferSchemaType('Barbería y Peluquería'), 'HealthAndBeautyBusiness');
    assert.equal(inferSchemaType('Detallado Automotriz'), 'AutoRepair');
    assert.equal(inferSchemaType('Soda y Comida Rápida'), 'FoodEstablishment');
    assert.equal(inferSchemaType('Clínica Dental'), 'MedicalBusiness');
    assert.equal(inferSchemaType('Canchas de Fútbol'), 'SportsActivityLocation');
    assert.equal(inferSchemaType('Ropa y Accesorios'), 'LocalBusiness');
    assert.equal(inferSchemaType(null), 'LocalBusiness');
  });

  await t.test('4. injectSeoIntoHtml replaces title and adds rich meta tags', () => {
    const rawHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Old Generic Title</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    const meta = {
      title: 'Comhar Autodetailing | Detallado Automotriz en Cartago',
      description: 'Lavado premium, pulido y protección cerámica en Cartago, Costa Rica.',
      canonicalUrl: 'https://betico.tech/sitio/comhar',
      image: 'https://betico.tech/uploads/comhar-banner.jpg',
      type: 'business.business',
      siteName: 'Comhar Autodetailing',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        name: 'Comhar Autodetailing',
        telephone: '+50684505315'
      }
    };

    const enriched = injectSeoIntoHtml(rawHtml, meta);

    // Replaces generic title
    assert.ok(enriched.includes('<title>Comhar Autodetailing | Detallado Automotriz en Cartago</title>'), 'Title must be replaced');
    assert.ok(!enriched.includes('Old Generic Title'), 'Old title must be removed');

    // Injects Open Graph tags
    assert.ok(enriched.includes('<meta property="og:title" content="Comhar Autodetailing | Detallado Automotriz en Cartago" />'));
    assert.ok(enriched.includes('<meta property="og:image" content="https://betico.tech/uploads/comhar-banner.jpg" />'));
    assert.ok(enriched.includes('<meta property="og:url" content="https://betico.tech/sitio/comhar" />'));
    assert.ok(enriched.includes('<meta property="og:locale" content="es_CR" />'));

    // Injects Twitter Card
    assert.ok(enriched.includes('<meta name="twitter:card" content="summary_large_image" />'));

    // Injects Schema.org JSON-LD
    assert.ok(enriched.includes('<script type="application/ld+json">'));
    assert.ok(enriched.includes('"@type": "AutoRepair"'));
    assert.ok(enriched.includes('+50684505315'));
  });

  await t.test('5. shouldBypassSeo strictly preserves private and administrative paths', () => {
    const privatePaths = [
      '/admin/dashboard',
      '/acceso',
      '/portal/login',
      '/kds/kitchen',
      '/repartidor/orders',
      '/especialista/carlos',
      '/colaborador/juan',
      '/equipo/marta',
      '/api/services',
      '/assets/index.js',
      '/uploads/image.png'
    ];

    for (const p of privatePaths) {
      assert.ok(shouldBypassSeo(p), `Path ${p} must be recognized as private and bypassed`);
    }

    const publicPaths = [
      '/',
      '/sitio/comhar',
      '/web/theclassicbarber',
      '/tienda/sodalulo',
      '/reservas/clinicasonrisas',
      '/canchas/central'
    ];

    for (const p of publicPaths) {
      assert.ok(!shouldBypassSeo(p), `Public path ${p} must NOT be bypassed`);
    }
  });

  await t.test('6. generateRobotsTxt includes sitemap and protects admin paths', () => {
    const robots = generateRobotsTxt('https://betico.tech');
    assert.ok(robots.includes('User-agent: *'));
    assert.ok(robots.includes('Allow: /sitio/'));
    assert.ok(robots.includes('Allow: /tienda/'));
    assert.ok(robots.includes('Disallow: /admin/'));
    assert.ok(robots.includes('Disallow: /api/'));
    assert.ok(robots.includes('Sitemap: https://betico.tech/sitemap.xml'));
  });
});
