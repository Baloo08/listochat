import { Request } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getWebsiteSettingsByTenant } from '../db/website.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';

export interface SeoMetadata {
  title: string;
  description: string;
  image: string;
  canonicalUrl: string;
  type: string;
  siteName: string;
  jsonLd: Record<string, any>;
}

// In-memory cache to prevent repeated DB hits during crawl bursts (TTL 10 min)
interface CacheEntry {
  metadata: SeoMetadata | null;
  expiresAt: number;
}
const seoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Normalizes an image path to an absolute HTTPS URL required by Open Graph crawlers (WhatsApp, Facebook, Twitter).
 */
export function toAbsoluteUrl(imagePath: string | undefined | null, baseUrl: string): string {
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

/**
 * Escapes characters for safe inclusion in HTML attribute content.
 */
export function escapeHtmlAttr(text: string | undefined | null): string {
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

/**
 * Infers Schema.org LocalBusiness sub-type based on category string.
 */
function inferSchemaType(category?: string | null): string {
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

/**
 * Resolves SEO metadata and Schema.org JSON-LD for a given URL route.
 */
export async function getSeoMetadata(pathname: string, baseUrl: string): Promise<SeoMetadata | null> {
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const cacheKey = `${baseUrl}:${cleanPath}`;

  const cached = seoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  try {
    let metadata: SeoMetadata | null = null;

    // 1. Root / Landing Page (Betico.tech)
    if (cleanPath === '/' || cleanPath === '' || cleanPath === '/index.html') {
      metadata = {
        title: 'Betico | Software de Citas, Tienda SINPE Móvil y Chatbot WhatsApp en Costa Rica',
        description: 'Automatiza tu negocio en Costa Rica con Betico: agendamiento de citas, catálogo con carrito SINPE Móvil, facturación electrónica y atención al cliente 24/7 con Inteligencia Artificial.',
        image: `${baseUrl}/logo.png`,
        canonicalUrl: `${baseUrl}/`,
        type: 'website',
        siteName: 'Betico.tech',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': 'Betico SaaS',
          'operatingSystem': 'Web, WhatsApp, iOS, Android',
          'applicationCategory': 'BusinessApplication',
          'url': baseUrl,
          'image': `${baseUrl}/logo.png`,
          'description': 'Plataforma integral para pymes y empresas en Costa Rica: agendamiento inteligente, tienda virtual con pagos SINPE Móvil y asistente virtual en WhatsApp.',
          'offers': {
            '@type': 'AggregateOffer',
            'priceCurrency': 'USD',
            'lowPrice': '29',
            'highPrice': '99'
          }
        }
      };
    }

    // 2. Client Website: /sitio/:slug or /web/:slug
    else if (cleanPath.startsWith('/sitio/') || cleanPath.startsWith('/web/')) {
      const slug = cleanPath.replace('/sitio/', '').replace('/web/', '').split('/')[0]?.toLowerCase().trim();
      if (slug) {
        const tenant = await getTenantBySlug(slug);
        if (tenant && tenant.active !== false) {
          const [website, store, services] = await Promise.all([
            getWebsiteSettingsByTenant(tenant.id).catch(() => null),
            getStoreSettings(tenant.id).catch(() => null),
            getServicesByTenant(tenant.id).catch(() => [])
          ]);

          const businessName = tenant.name || 'Negocio';
          const headline = website?.headline || store?.storeName || businessName;
          const desc = website?.subheadline || website?.aboutText || store?.storeDescription || 
            `Sitio web oficial, catálogo de servicios y citas en línea de ${businessName} en Costa Rica.`;
          const rawImage = website?.bannerImageUrl || website?.logoUrl || store?.storeBannerUrl || store?.storeLogoUrl;
          const image = toAbsoluteUrl(rawImage, baseUrl);
          const schemaType = inferSchemaType(website?.category || store?.storeCategory || (tenant as any).category);

          const offerList = (services || []).filter(s => s.active !== false).slice(0, 5).map(s => ({
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': s.name,
              'description': s.description || undefined
            },
            'price': s.price || undefined,
            'priceCurrency': 'CRC'
          }));

          metadata = {
            title: `${businessName} | Sitio Web Oficial y Citas en Línea`,
            description: desc.slice(0, 165),
            image,
            canonicalUrl: `${baseUrl}/sitio/${slug}`,
            type: 'business.business',
            siteName: businessName,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': schemaType,
              'name': businessName,
              'url': `${baseUrl}/sitio/${slug}`,
              'image': image,
              'telephone': tenant.whatsappNumber ? `+${tenant.whatsappNumber.replace(/\D/g, '')}` : undefined,
              'priceRange': 'CRC',
              'description': desc.slice(0, 250),
              ...(offerList.length > 0 ? {
                'hasOfferCatalog': {
                  '@type': 'OfferCatalog',
                  'name': 'Catálogo de Servicios',
                  'itemListElement': offerList
                }
              } : {})
            }
          };
        }
      }
    }

    // 3. Client Storefront: /tienda/:slug
    else if (cleanPath.startsWith('/tienda/')) {
      const slug = cleanPath.replace('/tienda/', '').split('/')[0]?.toLowerCase().trim();
      if (slug) {
        const tenant = await getTenantBySlug(slug);
        if (tenant && tenant.active !== false) {
          const store = await getStoreSettings(tenant.id).catch(() => null);
          const storeName = store?.storeName || tenant.name || 'Tienda en Línea';
          const desc = store?.storeDescription || 
            `Tienda en línea y catálogo oficial de ${storeName}. Realiza tus pedidos con SINPE Móvil y entrega a domicilio.`;
          const rawImage = store?.storeLogoUrl || store?.storeBannerUrl;
          const image = toAbsoluteUrl(rawImage, baseUrl);

          metadata = {
            title: `${storeName} | Tienda en Línea y Catálogo Oficial`,
            description: desc.slice(0, 165),
            image,
            canonicalUrl: `${baseUrl}/tienda/${slug}`,
            type: 'website',
            siteName: storeName,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'Store',
              'name': storeName,
              'url': `${baseUrl}/tienda/${slug}`,
              'image': image,
              'telephone': tenant.whatsappNumber ? `+${tenant.whatsappNumber.replace(/\D/g, '')}` : undefined,
              'priceRange': store?.currency || 'CRC',
              'description': desc.slice(0, 250),
              'currenciesAccepted': store?.currency || 'CRC',
              'paymentAccepted': 'SINPE Móvil, Transferencia Bancaria, Tarjeta de Crédito/Débito'
            }
          };
        }
      }
    }

    // 4. Client Public Bookings: /reservas/:slug
    else if (cleanPath.startsWith('/reservas/')) {
      const slug = cleanPath.replace('/reservas/', '').split('/')[0]?.toLowerCase().trim();
      if (slug) {
        const tenant = await getTenantBySlug(slug);
        if (tenant && tenant.active !== false) {
          const businessName = tenant.name || 'Agendamiento';
          const desc = `Agenda tu cita en línea de forma rápida y sencilla con ${businessName}. Consulta horarios disponibles y reserva tu espacio.`;
          const store = await getStoreSettings(tenant.id).catch(() => null);
          const image = toAbsoluteUrl(store?.storeLogoUrl || store?.storeBannerUrl, baseUrl);

          metadata = {
            title: `Reservar Cita en Línea | ${businessName}`,
            description: desc.slice(0, 165),
            image,
            canonicalUrl: `${baseUrl}/reservas/${slug}`,
            type: 'website',
            siteName: businessName,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              'name': businessName,
              'url': `${baseUrl}/reservas/${slug}`,
              'image': image,
              'telephone': tenant.whatsappNumber ? `+${tenant.whatsappNumber.replace(/\D/g, '')}` : undefined,
              'description': desc
            }
          };
        }
      }
    }

    // 5. Sports Courts Booking: /canchas/:slug
    else if (cleanPath.startsWith('/canchas/')) {
      const slug = cleanPath.replace('/canchas/', '').split('/')[0]?.toLowerCase().trim();
      if (slug) {
        const tenant = await getTenantBySlug(slug);
        if (tenant && tenant.active !== false) {
          const businessName = tenant.name || 'Canchas Deportivas';
          const desc = `Reserva tu cancha deportiva en ${businessName}. Consulta disponibilidad de horarios y confirma tu reserva al instante.`;
          const store = await getStoreSettings(tenant.id).catch(() => null);
          const image = toAbsoluteUrl(store?.storeLogoUrl || store?.storeBannerUrl, baseUrl);

          metadata = {
            title: `Reserva de Canchas Deportivas | ${businessName}`,
            description: desc.slice(0, 165),
            image,
            canonicalUrl: `${baseUrl}/canchas/${slug}`,
            type: 'website',
            siteName: businessName,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'SportsActivityLocation',
              'name': businessName,
              'url': `${baseUrl}/canchas/${slug}`,
              'image': image,
              'telephone': tenant.whatsappNumber ? `+${tenant.whatsappNumber.replace(/\D/g, '')}` : undefined,
              'description': desc
            }
          };
        }
      }
    }

    // Save to memory cache
    seoCache.set(cacheKey, {
      metadata,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return metadata;
  } catch (error) {
    console.error(`[SEO] Error fetching metadata for ${pathname}:`, error);
    return null;
  }
}

/**
 * Injects SEO tags, Open Graph meta, and Schema.org JSON-LD directly into the HTML string before responding.
 */
export async function injectSeoMetadata(html: string, req: Request): Promise<string> {
  const pathname = req.path;

  // Skip administrative and private views to keep raw SPA HTML
  if (
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
  ) {
    return html;
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'betico.tech';
  const baseUrl = `${protocol}://${host}`;

  try {
    const meta = await getSeoMetadata(pathname, baseUrl);
    if (!meta) {
      return html;
    }

    let modifiedHtml = html;

    // 1. Replace <title>
    if (meta.title) {
      modifiedHtml = modifiedHtml.replace(
        /<title>.*?<\/title>/i,
        `<title>${escapeHtmlAttr(meta.title)}</title>`
      );
    }

    // 2. Build the injection chunk with Open Graph, Twitter Cards, Canonical and JSON-LD
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

    // 3. Inject right before </head>
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${metaTags}\n</head>`);
    } else {
      modifiedHtml = `${metaTags}\n${modifiedHtml}`;
    }

    return modifiedHtml;
  } catch (err) {
    console.error('[SEO] Failed to inject SEO tags, falling back to clean HTML:', err);
    return html;
  }
}
