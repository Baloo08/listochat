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
  logoWhiteUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  buttonHoverEffect: boolean;
  buttonTextColor: string;
  showStoreButton: boolean;
  showBookingButton: boolean;
  showCourtsButton: boolean;
  storeButtonText: string;
  bookingButtonText: string;
  courtsButtonText: string;
  showWhatsappButton: boolean;
  whatsappButtonText: string;
  headerLayout: 'split' | 'overlay' | 'banner_top';
  overlayColor: string;
  overlayOpacity: number;
  showAboutSection: boolean;
  showFeaturesSection: boolean;
  showProductsSection: boolean;
  showServicesSection: boolean;
  showTestimonialsSection: boolean;
  showContactSection: boolean;
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
      buttonStyle: 'rounded',
      buttonHoverEffect: true,
      buttonTextColor: '#ffffff',
      showStoreButton: true,
      showBookingButton: true,
      showCourtsButton: false,
      storeButtonText: 'Ver Menú y Productos',
      bookingButtonText: 'Agendar Cita en Línea',
      courtsButtonText: 'Reservar Cancha',
      showWhatsappButton: true,
      whatsappButtonText: 'WhatsApp Directo',
      headerLayout: 'split',
      overlayColor: '#0f172a',
      overlayOpacity: 0,
      showAboutSection: true,
      showFeaturesSection: true,
      showProductsSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showContactSection: true,
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
    logoWhiteUrl: r.logo_white_url,
    primaryColor: r.primary_color || '#2563eb',
    accentColor: r.accent_color || '#f59e0b',
    fontFamily: r.font_family || 'Inter',
    buttonStyle: r.button_style || 'rounded',
    buttonHoverEffect: r.button_hover_effect !== false,
    buttonTextColor: r.button_text_color || '#ffffff',
    showStoreButton: r.show_store_button !== false,
    showBookingButton: r.show_booking_button !== false,
    showCourtsButton: r.show_courts_button === true,
    storeButtonText: r.store_button_text || 'Ver Menú y Productos',
    bookingButtonText: r.booking_button_text || 'Agendar Cita en Línea',
    courtsButtonText: r.courts_button_text || 'Reservar Cancha',
    showWhatsappButton: r.show_whatsapp_button !== false,
    whatsappButtonText: r.whatsapp_button_text || 'WhatsApp Directo',
    headerLayout: r.header_layout || 'split',
    overlayColor: r.overlay_color || '#0f172a',
    overlayOpacity: r.overlay_opacity !== undefined ? Number(r.overlay_opacity) : 0,
    showAboutSection: r.show_about_section !== false,
    showFeaturesSection: r.show_features_section !== false,
    showProductsSection: r.show_products_section !== false,
    showServicesSection: r.show_services_section !== false,
    showTestimonialsSection: r.show_testimonials_section !== false,
    showContactSection: r.show_contact_section !== false,
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
      about_image_url, banner_image_url, logo_url, logo_white_url, primary_color, accent_color, font_family,
      button_style, button_hover_effect, button_text_color,
      show_store_button, show_booking_button, show_courts_button, store_button_text, booking_button_text, courts_button_text,
      show_whatsapp_button, whatsapp_button_text, header_layout, overlay_color, overlay_opacity,
      show_about_section, show_features_section, show_products_section,
      show_services_section, show_testimonials_section, show_contact_section,
      features_json, testimonials_json, contact_email, contact_phone, contact_address,
      instagram_url, facebook_url, tiktok_url, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16,
      $17, $18, $19, $20, $21, $22,
      $23, $24, $25, $26, $27,
      $28, $29, $30,
      $31, $32, $33,
      $34, $35, $36, $37, $38,
      $39, $40, $41, CURRENT_TIMESTAMP
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
      logo_white_url = EXCLUDED.logo_white_url,
      primary_color = EXCLUDED.primary_color,
      accent_color = EXCLUDED.accent_color,
      font_family = EXCLUDED.font_family,
      button_style = EXCLUDED.button_style,
      button_hover_effect = EXCLUDED.button_hover_effect,
      button_text_color = EXCLUDED.button_text_color,
      show_store_button = EXCLUDED.show_store_button,
      show_booking_button = EXCLUDED.show_booking_button,
      show_courts_button = EXCLUDED.show_courts_button,
      store_button_text = EXCLUDED.store_button_text,
      booking_button_text = EXCLUDED.booking_button_text,
      courts_button_text = EXCLUDED.courts_button_text,
      show_whatsapp_button = EXCLUDED.show_whatsapp_button,
      whatsapp_button_text = EXCLUDED.whatsapp_button_text,
      header_layout = EXCLUDED.header_layout,
      overlay_color = EXCLUDED.overlay_color,
      overlay_opacity = EXCLUDED.overlay_opacity,
      show_about_section = EXCLUDED.show_about_section,
      show_features_section = EXCLUDED.show_features_section,
      show_products_section = EXCLUDED.show_products_section,
      show_services_section = EXCLUDED.show_services_section,
      show_testimonials_section = EXCLUDED.show_testimonials_section,
      show_contact_section = EXCLUDED.show_contact_section,
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
    data.logoWhiteUrl || null,
    data.primaryColor || '#2563eb',
    data.accentColor || '#f59e0b',
    data.fontFamily || 'Inter',
    data.buttonStyle || 'rounded',
    data.buttonHoverEffect !== false,
    data.buttonTextColor || '#ffffff',
    data.showStoreButton !== false,
    data.showBookingButton !== false,
    data.showCourtsButton === true,
    data.storeButtonText || 'Ver Menú y Productos',
    data.bookingButtonText || 'Agendar Cita en Línea',
    data.courtsButtonText || 'Reservar Cancha',
    data.showWhatsappButton !== false,
    data.whatsappButtonText || 'WhatsApp Directo',
    data.headerLayout || 'split',
    data.overlayColor || '#0f172a',
    data.overlayOpacity !== undefined ? Number(data.overlayOpacity) : 0,
    data.showAboutSection !== false,
    data.showFeaturesSection !== false,
    data.showProductsSection !== false,
    data.showServicesSection !== false,
    data.showTestimonialsSection !== false,
    data.showContactSection !== false,
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
