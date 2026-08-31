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
  MessageCircle,
  Instagram,
  Facebook,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

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
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✨</div>
          <p style={{ fontSize: '1rem', color: '#94a3b8' }}>Cargando sitio oficial...</p>
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
          textAlign: 'center', maxWidth: '400px', backgroundColor: '#1e293b',
          padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>Sitio Web No Disponible</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px 0' }}>{error}</p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '10px 20px', borderRadius: '8px',
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
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {website.logoUrl ? (
              <img
                src={website.logoUrl}
                alt={tenant.name}
                style={{ height: '42px', maxWidth: '140px', objectFit: 'contain' }}
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
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
              {tenant.name}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {website.showAboutSection !== false && (
              <a onClick={() => scrollTo('nosotros')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Sobre Nosotros</a>
            )}
            {website.showProductsSection !== false && featuredProducts && featuredProducts.length > 0 && (
              <a onClick={() => scrollTo('productos')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Productos & Menú</a>
            )}
            {website.showServicesSection !== false && featuredServices && featuredServices.length > 0 && (
              <a onClick={() => scrollTo('servicios')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Servicios</a>
            )}
            {website.showContactSection !== false && (
              <a onClick={() => scrollTo('contacto')} style={{ color: '#475569', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>Contacto</a>
            )}
          </div>

          {/* Direct CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {website.showStoreButton && (
              <a
                href={storeUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '8px',
                  backgroundColor: primaryColor, color: 'white',
                  textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem',
                  boxShadow: `0 4px 12px ${primaryColor}40`
                }}
              >
                <ShoppingBag size={16} />
                <span>{website.storeButtonText || 'Tienda / Menú'}</span>
              </a>
            )}

            {website.showBookingButton && (
              <a
                href={bookingUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '8px',
                  backgroundColor: '#ffffff', color: primaryColor,
                  border: `1.5px solid ${primaryColor}`,
                  textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem'
                }}
              >
                <Calendar size={16} />
                <span>{website.bookingButtonText || 'Agendar Cita'}</span>
              </a>
            )}
          </div>

        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '80px 20px 90px 20px',
        textAlign: 'center',
        background: website.bannerImageUrl
          ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${website.bannerImageUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        color: '#ffffff',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)',
            fontSize: '0.85rem', fontWeight: '700', color: accentColor, marginBottom: '20px'
          }}>
            <Sparkles size={16} />
            <span>Sitio Oficial de {tenant.name}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: '900',
            lineHeight: '1.15',
            letterSpacing: '-1px',
            margin: '0 0 20px 0'
          }}>
            {website.headline || `Bienvenido a ${tenant.name}`}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#cbd5e1',
            maxWidth: '750px',
            margin: '0 auto 36px auto',
            lineHeight: '1.6'
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

            {cleanPhone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 24px', borderRadius: '12px',
                  backgroundColor: '#25D366', color: 'white',
                  textDecoration: 'none', fontWeight: '800', fontSize: '1rem',
                  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)'
                }}
              >
                <MessageCircle size={20} />
                <span>WhatsApp Directo</span>
              </a>
            )}
          </div>

        </div>
      </section>

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
        <section id="nosotros" style={{ padding: '60px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: website.aboutImageUrl ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '40px', alignItems: 'center' }}>
            
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: primaryColor, fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px'
              }}>
                🌟 Conócenos
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                {website.aboutTitle || 'Nuestra Historia & Compromiso'}
              </h2>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.7', margin: '0 0 24px 0', whiteSpace: 'pre-line' }}>
                {website.aboutText || 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría.'}
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>
                  <ShieldCheck size={20} color={primaryColor} /> 100% Calidad Garantizada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>
                  <Clock size={20} color={primaryColor} /> Atención Inmediata
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
                🛍️ Catálogo Digital
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
                          padding: '6px 12px', borderRadius: '8px',
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
                  📅 Agenda en Línea
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
              ⭐⭐⭐⭐⭐ Opiniones Reales
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
                    <Star key={i} size={16} fill="#f59e0b" />
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

      {/* 8. CONTACTO & FOOTER */}
      {website.showContactSection !== false && (
        <footer id="contacto" style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '60px 20px 30px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>{tenant.name}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                {website.subheadline || 'Gracias por visitar nuestro sitio web oficial. Estamos a tu servicio.'}
              </p>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {website.instagramUrl && (
                  <a href={website.instagramUrl} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Instagram size={18} />
                  </a>
                )}
                {website.facebookUrl && (
                  <a href={website.facebookUrl} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Facebook size={18} />
                  </a>
                )}
                {cleanPhone && (
                  <a href={waUrl} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 14px 0', color: accentColor }}>Enlaces Rápidos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                {website.showStoreButton && <a href={storeUrl} style={{ color: '#cbd5e1', textDecoration: 'none' }}>🛒 Tienda / Menú Online</a>}
                {website.showBookingButton && <a href={bookingUrl} style={{ color: '#cbd5e1', textDecoration: 'none' }}>📅 Agendar Cita en Línea</a>}
                {website.showAboutSection !== false && <a onClick={() => scrollTo('nosotros')} style={{ color: '#cbd5e1', cursor: 'pointer' }}>Sobre Nosotros</a>}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 14px 0', color: accentColor }}>Contacto Directo</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                {website.contactAddress && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={16} color={primaryColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{website.contactAddress}</span>
                  </div>
                )}
                {website.contactPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} color={primaryColor} />
                    <span>{website.contactPhone}</span>
                  </div>
                )}
                {website.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color={primaryColor} />
                    <span>{website.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados. • Desarrollado con ⚡ <a href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>Betico</a>
          </div>
        </footer>
      )}

    </div>
  );
}
