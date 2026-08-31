import { query } from './pool.js';

export interface TenantWebsiteConfig {
  id?: string;
  tenantId: string;
  websiteEnabled: boolean;
  headline: string;
  subheadline: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl?: string;
  bannerImageUrl?: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  showStoreButton: boolean;
  showBookingButton: boolean;
  storeButtonText: string;
  bookingButtonText: string;
  featuresJson: { title: string; desc: string; icon?: string }[];
  testimonialsJson: { name: string; comment: string; rating?: number }[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getWebsiteSettingsByTenant(tenantId: string): Promise<TenantWebsiteConfig> {
  const res = await query(
    `SELECT * FROM tenant_websites WHERE tenant_id = $1`,
    [tenantId]
  );

  if (res.rows.length === 0) {
    return {
      tenantId,
      websiteEnabled: true,
      headline: 'Bienvenido a nuestro sitio oficial',
      subheadline: 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
      aboutTitle: 'Conoce Nuestra Historia',
      aboutText: 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría. Nuestro compromiso es tu satisfacción total.',
      primaryColor: '#2563eb',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      showStoreButton: true,
      showBookingButton: true,
      storeButtonText: 'Ver Menú y Productos',
      bookingButtonText: 'Agendar Cita en Línea',
      featuresJson: [
        { title: 'Calidad Garantizada', desc: 'Productos y servicios seleccionados con los más altos estándares.' },
        { title: 'Atención Rápida', desc: 'Respuestas y pedidos inmediatos con asistencia 24/7.' },
        { title: 'Pagos Seguros', desc: 'Aceptamos SINPE Móvil, transferencias y tarjetas.' }
      ],
      testimonialsJson: [
        { name: 'Cliente Satisfecho', comment: '¡Excelente servicio y atención rápida! 100% recomendado.', rating: 5 }
      ]
    };
  }

  const r = res.rows[0];
  return {
    id: r.id,
    tenantId: r.tenant_id,
    websiteEnabled: r.website_enabled !== false,
    headline: r.headline || 'Bienvenido a nuestro sitio oficial',
    subheadline: r.subheadline || 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
    aboutTitle: r.about_title || 'Conoce Nuestra Historia',
    aboutText: r.about_text || '',
    aboutImageUrl: r.about_image_url,
    bannerImageUrl: r.banner_image_url,
    logoUrl: r.logo_url,
    primaryColor: r.primary_color || '#2563eb',
    accentColor: r.accent_color || '#f59e0b',
    fontFamily: r.font_family || 'Inter',
    showStoreButton: r.show_store_button !== false,
    showBookingButton: r.show_booking_button !== false,
    storeButtonText: r.store_button_text || 'Ver Menú y Productos',
    bookingButtonText: r.booking_button_text || 'Agendar Cita en Línea',
    featuresJson: Array.isArray(r.features_json) ? r.features_json : [],
    testimonialsJson: Array.isArray(r.testimonials_json) ? r.testimonials_json : [],
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    contactAddress: r.contact_address,
    instagramUrl: r.instagram_url,
    facebookUrl: r.facebook_url,
    tiktokUrl: r.tiktok_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function saveWebsiteSettings(tenantId: string, data: Partial<TenantWebsiteConfig>): Promise<TenantWebsiteConfig> {
  const sql = `
    INSERT INTO tenant_websites (
      tenant_id, website_enabled, headline, subheadline, about_title, about_text,
      about_image_url, banner_image_url, logo_url, primary_color, accent_color, font_family,
      show_store_button, show_booking_button, store_button_text, booking_button_text,
      features_json, testimonials_json, contact_email, contact_phone, contact_address,
      instagram_url, facebook_url, tiktok_url, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19, $20, $21,
      $22, $23, $24, CURRENT_TIMESTAMP
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      website_enabled = EXCLUDED.website_enabled,
      headline = EXCLUDED.headline,
      subheadline = EXCLUDED.subheadline,
      about_title = EXCLUDED.about_title,
      about_text = EXCLUDED.about_text,
      about_image_url = EXCLUDED.about_image_url,
      banner_image_url = EXCLUDED.banner_image_url,
      logo_url = EXCLUDED.logo_url,
      primary_color = EXCLUDED.primary_color,
      accent_color = EXCLUDED.accent_color,
      font_family = EXCLUDED.font_family,
      show_store_button = EXCLUDED.show_store_button,
      show_booking_button = EXCLUDED.show_booking_button,
      store_button_text = EXCLUDED.store_button_text,
      booking_button_text = EXCLUDED.booking_button_text,
      features_json = EXCLUDED.features_json,
      testimonials_json = EXCLUDED.testimonials_json,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      contact_address = EXCLUDED.contact_address,
      instagram_url = EXCLUDED.instagram_url,
      facebook_url = EXCLUDED.facebook_url,
      tiktok_url = EXCLUDED.tiktok_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const values = [
    tenantId,
    data.websiteEnabled !== false,
    data.headline || 'Bienvenido a nuestro sitio oficial',
    data.subheadline || '',
    data.aboutTitle || 'Conoce Nuestra Historia',
    data.aboutText || '',
    data.aboutImageUrl || null,
    data.bannerImageUrl || null,
    data.logoUrl || null,
    data.primaryColor || '#2563eb',
    data.accentColor || '#f59e0b',
    data.fontFamily || 'Inter',
    data.showStoreButton !== false,
    data.showBookingButton !== false,
    data.storeButtonText || 'Ver Menú y Productos',
    data.bookingButtonText || 'Agendar Cita en Línea',
    JSON.stringify(data.featuresJson || []),
    JSON.stringify(data.testimonialsJson || []),
    data.contactEmail || null,
    data.contactPhone || null,
    data.contactAddress || null,
    data.instagramUrl || null,
    data.facebookUrl || null,
    data.tiktokUrl || null
  ];

  await query(sql, values);
  return getWebsiteSettingsByTenant(tenantId);
}
