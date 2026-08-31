import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  Star,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Award,
  CreditCard,
  Truck
} from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, TikTokIcon } from '../client/components/WebsiteBuilder';

interface WebsitePublicViewProps {
  slug: string;
}

export default function WebsitePublicView({ slug }: WebsitePublicViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPublicData();
  }, [slug]);

  const loadPublicData = async () => {
    try {
      setLoading(true);
      let res = await fetch(`/api/website-public/${slug}`);
      if (!res.ok) {
        res = await fetch(`/api/website/public/${slug}`);
      }
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Sitio web no encontrado');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el sitio web');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Cargando sitio oficial...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '20px'
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '420px', backgroundColor: '#1e293b',
          padding: '36px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <ShieldCheck size={48} color="#38bdf8" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 8px 0', fontWeight: '800' }}>Sitio Web No Disponible</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 24px 0', lineHeight: '1.5' }}>{error}</p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '10px 22px', borderRadius: '10px',
              backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem'
            }}
          >
            Ir a Inicio
          </a>
        </div>
      </div>
    );
  }

  const { tenant, website, store, featuredServices, featuredProducts } = data;
  const primaryColor = website.primaryColor || '#2563eb';
  const accentColor = website.accentColor || '#f59e0b';
  const fontFamily = website.fontFamily || 'Inter';

  const storeUrl = `/tienda/${tenant.slug}`;
  const bookingUrl = `/reservas/${tenant.slug}`;
  const cleanPhone = (tenant.whatsappNumber || website.contactPhone || '').replace(/\D/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hola%2C%20estoy%20visitando%20su%20sitio%20web%20y%20tengo%20una%20consulta` : '#';

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const headerLayout = website.headerLayout || 'split';
  const overlayOpacity = (website.overlayOpacity !== undefined ? Number(website.overlayOpacity) : 0) / 100;
  const overlayColor = website.overlayColor || '#0f172a';

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  };

  return (
    <div style={{
      fontFamily,
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>

      {/* 1. TOP NAVBAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {website.logoUrl ? (
              <img
                src={website.logoUrl}
                alt={tenant.name}
                style={{ height: '42px', maxWidth: '150px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: primaryColor, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
              }}>
                {tenant.name?.charAt(0) || 'B'}
              </div>
            )}
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
              {tenant.name}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {website.showAboutSection !== false && (
              <a onClick={() => scrollTo('nosotros')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', transition: 'color 0.2s' }}>Sobre Nosotros</a>
            )}
            {website.showProductsSection !== false && featuredProducts && featuredProducts.length > 0 && (
              <a onClick={() => scrollTo('productos')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', transition: 'color 0.2s' }}>Productos & Menú</a>
            )}
            {website.showServicesSection !== false && featuredServices && featuredServices.length > 0 && (
              <a onClick={() => scrollTo('servicios')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', transition: 'color 0.2s' }}>Servicios</a>
            )}
            {website.showContactSection !== false && (
              <a onClick={() => scrollTo('contacto')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', transition: 'color 0.2s' }}>Contacto</a>
            )}
          </div>

          {/* Direct CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {website.showStoreButton && (
              <a
                href={storeUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '8px',
                  backgroundColor: primaryColor, color: 'white',
                  textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem',
                  boxShadow: `0 4px 12px ${primaryColor}35`
                }}
              >
                <ShoppingBag size={16} />
                <span>{website.storeButtonText || 'Ver Menú'}</span>
              </a>
            )}

            {website.showBookingButton && (
              <a
                href={bookingUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '8px',
                  backgroundColor: '#ffffff', color: primaryColor,
                  border: `1.5px solid ${primaryColor}`,
                  textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem'
                }}
              >
                <Calendar size={16} />
                <span>{website.bookingButtonText || 'Citas'}</span>
              </a>
            )}
          </div>

        </div>
      </nav>

      {/* 2. HERO / PORTADA */}
      {headerLayout === 'split' ? (
        /* MODO SPLIT: TEXTO A LA IZQUIERDA, IMAGEN LIMPIA A LA DERECHA */
        <section style={{
          padding: '60px 24px 80px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: website.bannerImageUrl ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr',
            gap: '40px',
            alignItems: 'center'
          }}>
            
            {/* Texto y Botones */}
            <div>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                fontWeight: '900',
                lineHeight: '1.15',
                letterSpacing: '-1px',
                color: '#0f172a',
                margin: '0 0 18px 0'
              }}>
                {website.headline || `Bienvenido a ${tenant.name}`}
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: '#475569',
                lineHeight: '1.6',
                margin: '0 0 32px 0'
              }}>
                {website.subheadline || 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.'}
              </p>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {website.showStoreButton && (
                  <a
                    href={storeUrl}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '13px 24px', borderRadius: '10px',
                      backgroundColor: primaryColor, color: 'white',
                      textDecoration: 'none', fontWeight: '800', fontSize: '0.95rem',
                      boxShadow: `0 6px 18px ${primaryColor}40`
                    }}
                  >
                    <ShoppingBag size={18} />
                    <span>{website.storeButtonText || 'Ver Menú y Productos'}</span>
                    <ArrowRight size={16} />
                  </a>
                )}

                {website.showBookingButton && (
                  <a
                    href={bookingUrl}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '13px 24px', borderRadius: '10px',
                      backgroundColor: '#ffffff', color: '#0f172a',
                      border: '1.5px solid #cbd5e1',
                      textDecoration: 'none', fontWeight: '800', fontSize: '0.95rem'
                    }}
                  >
                    <Calendar size={18} color={primaryColor} />
                    <span>{website.bookingButtonText || 'Agendar Cita en Línea'}</span>
                  </a>
                )}

                {website.showWhatsappButton !== false && cleanPhone && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '13px 22px', borderRadius: '10px',
                      backgroundColor: '#16a34a', color: 'white',
                      textDecoration: 'none', fontWeight: '800', fontSize: '0.95rem',
                      boxShadow: '0 6px 18px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <WhatsAppIcon size={18} color="white" />
                    <span>{website.whatsappButtonText || 'WhatsApp Directo'}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Imagen Limpia a la Derecha */}
            {website.bannerImageUrl && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={website.bannerImageUrl}
                  alt={tenant.name}
                  style={{
                    width: '100%',
                    maxHeight: '420px',
                    objectFit: 'contain',
                    borderRadius: '16px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.08)'
                  }}
                />
              </div>
            )}

          </div>
        </section>
      ) : (
        /* MODO OVERLAY: TEXTO SOBRE IMAGEN CON FILTRO CONTROLADO */
        <section style={{
          position: 'relative',
          padding: '90px 20px 100px 20px',
          textAlign: 'center',
          background: website.bannerImageUrl
            ? `${overlayOpacity > 0 ? `linear-gradient(${hexToRgba(overlayColor, overlayOpacity)}, ${hexToRgba(overlayColor, overlayOpacity)}), ` : ''}url(${website.bannerImageUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
          color: '#ffffff',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            
            <h1 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: '900',
              lineHeight: '1.15',
              letterSpacing: '-1px',
              margin: '0 0 20px 0',
              textShadow: overlayOpacity === 0 ? '0 2px 10px rgba(0,0,0,0.8)' : 'none'
            }}>
              {website.headline || `Bienvenido a ${tenant.name}`}
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: '#f1f5f9',
              maxWidth: '750px',
              margin: '0 auto 36px auto',
              lineHeight: '1.6',
              textShadow: overlayOpacity === 0 ? '0 2px 8px rgba(0,0,0,0.8)' : 'none'
            }}>
              {website.subheadline || 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.'}
            </p>

            {/* Action Buttons in Hero */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px' }}>
              {website.showStoreButton && (
                <a
                  href={storeUrl}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '12px',
                    backgroundColor: primaryColor, color: 'white',
                    textDecoration: 'none', fontWeight: '800', fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <ShoppingBag size={20} />
                  <span>{website.storeButtonText || 'Ver Menú y Productos'}</span>
                  <ArrowRight size={18} />
                </a>
              )}

              {website.showBookingButton && (
                <a
                  href={bookingUrl}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '12px',
                    backgroundColor: '#ffffff', color: '#0f172a',
                    textDecoration: 'none', fontWeight: '800', fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <Calendar size={20} color={primaryColor} />
                  <span>{website.bookingButtonText || 'Agendar Cita en Línea'}</span>
                </a>
              )}

              {website.showWhatsappButton !== false && cleanPhone && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 24px', borderRadius: '12px',
                    backgroundColor: '#16a34a', color: 'white',
                    textDecoration: 'none', fontWeight: '800', fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <WhatsAppIcon size={20} color="white" />
                  <span>{website.whatsappButtonText || 'WhatsApp Directo'}</span>
                </a>
              )}
            </div>

          </div>
        </section>
      )}

      {/* 3. BENEFICIOS / PUNTOS CLAVE */}
      {website.showFeaturesSection !== false && website.featuresJson && website.featuresJson.length > 0 && (
        <section style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {website.featuresJson.map((f: any, idx: number) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  backgroundColor: `${primaryColor}15`, color: primaryColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    {f.title}
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SOBRE NOSOTROS */}
      {website.showAboutSection !== false && (
        <section id="nosotros" style={{ padding: '70px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: website.aboutImageUrl ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '40px', alignItems: 'center' }}>
            
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: primaryColor, fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px'
              }}>
                <Award size={18} /> Nuestra Filosofía
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                {website.aboutTitle || 'Nuestra Historia & Compromiso'}
              </h2>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.7', margin: '0 0 24px 0', whiteSpace: 'pre-line' }}>
                {website.aboutText || 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría.'}
              </p>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '700', fontSize: '0.9rem' }}>
                  <ShieldCheck size={20} color={primaryColor} /> Calidad Garantizada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '700', fontSize: '0.9rem' }}>
                  <Clock size={20} color={primaryColor} /> Atención Rápida
                </div>
              </div>
            </div>

            {website.aboutImageUrl && (
              <div>
                <img
                  src={website.aboutImageUrl}
                  alt="Sobre Nosotros"
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                />
              </div>
            )}

          </div>
        </section>
      )}

      {/* 5. PRODUCTOS / MENÚ DESTACADO */}
      {website.showProductsSection !== false && featuredProducts && featuredProducts.length > 0 && (
        <section id="productos" style={{ padding: '70px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ color: primaryColor, fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                Catálogo Digital
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Productos y Menú Destacado
              </h2>
            </div>
            <a
              href={storeUrl}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: primaryColor, fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none'
              }}
            >
              <span>Ver Catálogo Completo</span>
              <ChevronRight size={18} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {featuredProducts.map((prod: any) => {
              const imgUrl = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
              return (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '170px', backgroundColor: '#f1f5f9', position: 'relative' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{prod.name}</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.description || ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>
                        ₡{Number(prod.price || 0).toLocaleString('es-CR')}
                      </span>
                      <a
                        href={storeUrl}
                        style={{
                          padding: '6px 14px', borderRadius: '8px',
                          backgroundColor: primaryColor, color: 'white',
                          textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem'
                        }}
                      >
                        Pedir
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. SERVICIOS DESTACADOS */}
      {website.showServicesSection !== false && featuredServices && featuredServices.length > 0 && (
        <section id="servicios" style={{ padding: '70px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ color: primaryColor, fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Agenda en Línea
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  Nuestros Servicios
                </h2>
              </div>
              <a
                href={bookingUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  color: primaryColor, fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none'
                }}
              >
                <span>Agendar Cita en Línea</span>
                <ChevronRight size={18} />
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {featuredServices.map((srv: any) => (
                <div
                  key={srv.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>{srv.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {srv.duration}
                    </span>
                    <div style={{ marginTop: '8px', fontSize: '1.05rem', fontWeight: '900', color: primaryColor }}>
                      ₡{Number(srv.price || 0).toLocaleString('es-CR')}
                    </div>
                  </div>
                  <a
                    href={bookingUrl}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      backgroundColor: '#ffffff', color: primaryColor,
                      border: `1.5px solid ${primaryColor}`,
                      textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem'
                    }}
                  >
                    Reservar
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. TESTIMONIOS */}
      {website.showTestimonialsSection !== false && website.testimonialsJson && website.testimonialsJson.length > 0 && (
        <section id="testimonios" style={{ padding: '70px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ color: accentColor, fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>
              Opiniones Reales
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Lo Que Dicen Nuestros Clientes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {website.testimonialsJson.map((t: any, idx: number) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', color: '#f59e0b' }}>
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 16px 0', fontStyle: 'italic' }}>
                  "{t.comment}"
                </p>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{t.name}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. FOOTER ESTÉTICO Y ELEGANTE */}
      {website.showContactSection !== false && (
        <footer id="contacto" style={{
          backgroundColor: '#0b1120',
          color: '#f8fafc',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '70px 24px 30px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '50px'
          }}>
            
            {/* Columna 1: Marca & Descripción */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                {website.logoUrl ? (
                  <img src={website.logoUrl} alt={tenant.name} style={{ height: '36px', maxWidth: '120px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {tenant.name?.charAt(0) || 'B'}
                  </div>
                )}
                <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>
                  {tenant.name}
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                {website.subheadline || 'Atención personalizada, calidad superior y compras rápidas por WhatsApp.'}
              </p>

              {/* Redes Sociales Oficiales */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {website.instagramUrl && (
                  <a
                    href={website.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e1306c',
                      transition: 'all 0.2s'
                    }}
                  >
                    <InstagramIcon size={18} color="#e1306c" />
                  </a>
                )}
                {website.facebookUrl && (
                  <a
                    href={website.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1877f2',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FacebookIcon size={18} color="#1877f2" />
                  </a>
                )}
                {website.tiktokUrl && (
                  <a
                    href={website.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <TikTokIcon size={18} color="#ffffff" />
                  </a>
                )}
                {cleanPhone && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      backgroundColor: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366',
                      transition: 'all 0.2s'
                    }}
                  >
                    <WhatsAppIcon size={18} color="#25D366" />
                  </a>
                )}
              </div>
            </div>

            {/* Columna 2: Enlaces Rápidos */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 16px 0', color: '#ffffff' }}>Enlaces Rápidos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                {website.showStoreButton && (
                  <a href={storeUrl} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>Tienda & Menú Online</a>
                )}
                {website.showBookingButton && (
                  <a href={bookingUrl} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>Agendar Cita en Línea</a>
                )}
                {website.showAboutSection !== false && (
                  <a onClick={() => scrollTo('nosotros')} style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}>Sobre Nosotros</a>
                )}
                {website.showProductsSection !== false && (
                  <a onClick={() => scrollTo('productos')} style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}>Catálogo Digital</a>
                )}
                {website.showServicesSection !== false && (
                  <a onClick={() => scrollTo('servicios')} style={{ color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}>Nuestros Servicios</a>
                )}
              </div>
            </div>

            {/* Columna 3: Información de Contacto */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 16px 0', color: '#ffffff' }}>Contacto Oficial</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#94a3b8' }}>
                {website.contactAddress && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <MapPin size={16} color={primaryColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: '1.5' }}>{website.contactAddress}</span>
                  </div>
                )}
                {website.contactPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={16} color={primaryColor} style={{ flexShrink: 0 }} />
                    <span>{website.contactPhone}</span>
                  </div>
                )}
                {website.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} color={primaryColor} style={{ flexShrink: 0 }} />
                    <span>{website.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna 4: Pagos Seguros & Garantía */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 16px 0', color: '#ffffff' }}>Garantía & Confianza</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#10b981" /> Pagos seguros con SINPE Móvil
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} color="#38bdf8" /> Entregas express y retiro en local
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#f59e0b" /> Atención personalizada 24/7
                </div>
              </div>
            </div>

          </div>

          {/* Copyright & Marca de Agua */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            <div>
              © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
            </div>
            <div>
              Impulsado por <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>Betico</a>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
