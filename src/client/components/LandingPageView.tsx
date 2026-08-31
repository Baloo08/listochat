import React, { useState, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Utensils,
  MapPin,
  TrendingUp,
  ArrowRight,
  Clock,
  Send,
  Building2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Lock,
  Headphones,
  Check,
  ShoppingBag,
  Calendar,
  Palette,
  CheckCircle,
  Menu,
  X,
  CreditCard,
  Truck,
  ExternalLink,
  Store,
  Star,
  Users
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export default function LandingPageView({ onLoginClick, isLoggedIn, onGoToDashboard }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyMessages, setDailyMessages] = useState<number>(120);
  const [avgTicket, setAvgTicket] = useState<number>(8500);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 960);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 960);
      if (window.innerWidth >= 960) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hoursSavedPerMonth = Math.round((dailyMessages * 2.5 * 30) / 60);
  const estimatedRecoveredSales = Math.round(dailyMessages * 0.08 * avgTicket * 30);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: '¿Necesito cambiar mi número de WhatsApp actual?',
      a: 'No. Puedes conectar tu número de WhatsApp existente (personal o Business) simplemente escaneando un código QR desde la aplicación de WhatsApp en tu teléfono en menos de 1 minuto.'
    },
    {
      q: '¿Cómo funciona la verificación automática de SINPE Móvil?',
      a: 'Cuando un cliente te envía una captura de su comprobante bancario por WhatsApp o en la tienda online, la Inteligencia Artificial con Visión analiza el comprobante en tiempo real, verifica el monto, la referencia y el teléfono de destino, y marca el pedido como pagado al instante sin que tengas que revisar tu app bancaria manualmente.'
    },
    {
      q: '¿El asistente entiende notas de voz y modismos costarricenses?',
      a: 'Sí. Betico está entrenado con IA avanzada y reconoce notas de voz, audios rápidos y expresiones comunes de Costa Rica ("pura vida", "mae", "a nombre de", "sinpe", "para llevar", etc.).'
    },
    {
      q: '¿La tienda online y la agenda de citas tienen costo adicional?',
      a: 'No, vienen 100% incluidas en tu suscripción de Betico. Puedes activar tanto la tienda online para vender productos como la agenda de citas para servicios, con tu propio enlace personalizado y sin comisiones por venta.'
    },
    {
      q: '¿Puedo personalizar los colores y logos con mi marca?',
      a: 'Totalmente. Desde tu panel de control puedes subir tu logotipo, banner de portada, seleccionar tu paleta de colores corporativa y personalizar los mensajes de bienvenida y confirmación.'
    },
    {
      q: '¿Puedo gestionar varias sucursales o locales?',
      a: 'Sí. Betico incluye un módulo multi-sucursal completo con cálculo de entrega por GPS a la sede más cercana, pantallas de cocina (KDS) independientes por local y cuentas SINPE separadas por sede.'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      color: '#f8fafc',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      
      {/* ==============================================================
          1. NAVIGATION BAR
      ============================================================== */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(11, 15, 25, 0.92)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 16px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '38px', height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <Bot size={22} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>
                Betico<span style={{ color: '#10b981' }}>.tech</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (Visible only on desktop) */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.88rem', fontWeight: '600' }}>
              <a onClick={() => scrollToSection('tienda')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Tienda Online</a>
              <a onClick={() => scrollToSection('agenda')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Agenda & Citas</a>
              <a onClick={() => scrollToSection('personalizacion')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Personalización</a>
              <a onClick={() => scrollToSection('modulos')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Módulos & IA</a>
              <a onClick={() => scrollToSection('roi')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Calculadora</a>
              <a onClick={() => scrollToSection('planes')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Planes</a>
              <a onClick={() => scrollToSection('faq')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Preguntas</a>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard || (() => { window.location.href = '/app'; })}
                style={{
                  padding: '9px 18px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Zap size={16} /> Ir a mi Panel
              </button>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Iniciar Sesión
                </button>

                {!isMobile && (
                  <a
                    href="https://wa.me/50688888888?text=Hola%20Betico%2C%20quiero%20solicitar%20una%20demostraci%C3%B3n%20para%20mi%20negocio"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <MessageSquare size={15} /> Demo
                  </a>
                )}
              </>
            )}

            {/* Mobile Hamburger Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Abrir Menú"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            backgroundColor: '#131c2e',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.95rem',
            fontWeight: '600'
          }}>
            <a onClick={() => scrollToSection('tienda')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🛍️ Tienda Online & Menús</a>
            <a onClick={() => scrollToSection('agenda')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>📅 Agenda & Citas 24/7</a>
            <a onClick={() => scrollToSection('personalizacion')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🎨 Personalización de Marca</a>
            <a onClick={() => scrollToSection('modulos')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>⚙️ Módulos & IA</a>
            <a onClick={() => scrollToSection('roi')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>💰 Calculadora de Ahorro</a>
            <a onClick={() => scrollToSection('planes')} style={{ color: '#f8fafc', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🏷️ Planes & Precios</a>
            <a onClick={() => scrollToSection('faq')} style={{ color: '#f8fafc', padding: '8px 0' }}>❓ Preguntas Frecuentes</a>
            <a
              href="https://wa.me/50688888888?text=Hola%20Betico%2C%20quiero%20solicitar%20una%20demostraci%C3%B3n"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '8px',
                padding: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              💬 Solicitar Demo por WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* ==============================================================
          2. HERO SECTION
      ============================================================== */}
      <section style={{
        padding: isMobile ? '50px 16px 40px 16px' : '80px 24px 60px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Glow pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '9999px',
          fontSize: isMobile ? '0.78rem' : '0.85rem',
          fontWeight: '700',
          color: '#34d399',
          marginBottom: '20px',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Zap size={16} />
          <span>⚡ Impulsado por Betico IA: Nuestro Motor de IA Propio y Seguro</span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(1.9rem, 6vw, 3.8rem)',
          fontWeight: '800',
          lineHeight: '1.15',
          letterSpacing: '-1px',
          margin: '0 0 16px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          wordBreak: 'break-word'
        }}>
          Vende, Agenda y Cobra en Automático por WhatsApp
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)',
          color: '#94a3b8',
          maxWidth: '820px',
          margin: '0 auto 30px auto',
          lineHeight: '1.6',
          padding: '0 8px'
        }}>
          Atiende a tus clientes 24/7 sin esperas, recibe pedidos en tu propia <strong style={{ color: '#ffffff' }}>Tienda Online</strong>, llena tu <strong style={{ color: '#ffffff' }}>Agenda de Citas</strong> y confirma pagos de <strong style={{ color: '#34d399' }}>SINPE Móvil al instante</strong>.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '45px' }}>
          <a
            href="https://wa.me/50688888888?text=Hola%20Betico%2C%20quiero%20ver%20la%20demostraci%C3%B3n%20en%20vivo"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: isMobile ? '12px 20px' : '15px 30px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Zap size={18} /> Probar Demo en WhatsApp
          </a>

          <button
            onClick={onLoginClick}
            style={{
              padding: isMobile ? '12px 20px' : '15px 30px',
              backgroundColor: '#1e293b',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Ingresar a mi Panel <ArrowRight size={18} />
          </button>
        </div>

        {/* Live Simulation Card */}
        <div style={{
          maxWidth: '850px',
          margin: '0 auto',
          backgroundColor: '#1e293b',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'left',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#94a3b8', marginLeft: '6px', fontWeight: '600' }}>
                Demostración • WhatsApp & SINPE
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '9999px', fontWeight: 'bold' }}>
              0.8s
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: isMobile ? '90%' : '75%', backgroundColor: '#334155', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#38bdf8', fontWeight: 'bold', fontSize: '0.8rem' }}>
                <Volume2 size={15} />
                <span>Nota de Voz del Cliente (0:08)</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.82rem' }}>
                "Buenas mae! Tienen hamburguesa doble especial para mandar a Escazú?"
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: isMobile ? '92%' : '80%', backgroundColor: '#065f46', padding: '12px 16px', borderRadius: '14px 14px 4px 14px', fontSize: '0.88rem', color: '#ecfdf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 'bold', color: '#6ee7b7', fontSize: '0.82rem' }}>
                <Bot size={15} /> Betico IA
              </div>
              ¡Pura vida! Claro que sí, tenemos la <strong>Hamburguesa Doble Especial (₡6.500)</strong> disponible en Escazú 🍔.<br />
              🛵 Envío Express a Escazú: <strong>₡1.500</strong>.<br />
              ¿Deseas que te tome la orden de una vez o prefieres ver nuestro menú digital?
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: isMobile ? '92%' : '80%', backgroundColor: '#064e3b', border: '1px solid #059669', padding: '12px 16px', borderRadius: '14px 14px 4px 14px', fontSize: '0.88rem', color: '#ecfdf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#a7f3d0', marginBottom: '4px', fontSize: '0.82rem' }}>
                <ShieldCheck size={16} /> ✅ SINPE Móvil Verificado Automáticamente
              </div>
              <div style={{ fontSize: '0.82rem' }}>Monto detectado: <strong>₡8.000</strong> • Ref: <strong>#948201</strong></div>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '4px' }}>
                ⚡ Comanda enviada a la pantalla de cocina (KDS) y motorizado asignado.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. SPOTLIGHT SECTION 1: TIENDA ONLINE & MENÚS QR (#tienda)
      ============================================================== */}
      <section id="tienda" style={{ padding: isMobile ? '60px 16px' : '90px 24px', backgroundColor: '#0e1626', borderTop: '1px solid rgba(255,255,255,0.06)', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '30px' : '50px', alignItems: 'center' }}>
            
            {/* Text & Benefits */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '14px' }}>
                <ShoppingBag size={14} /> E-COMMERCE & MENÚ DIGITAL
              </div>

              <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 14px 0' }}>
                Tu Propia Tienda Online sin Pagar Comisiones por Venta
              </h2>

              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                Dile adiós a las comisiones del 30% de las apps de delivery. Con Betico obtienes tu propio catálogo web y menú QR con tu marca, fotos en alta calidad y cobro directo.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                    <Check size={16} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '700' }}>Variantes y Opciones Personalizadas</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Tallas, colores, sabores, ingredientes extra y control de inventario automático.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                    <Truck size={16} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '700' }}>Cálculo de Envíos Express (GPS) y Correos de CR</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Tarifas exactas por distancia a la ubicación del cliente y enlace de ruta directo a Waze.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                    <CreditCard size={16} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '700' }}>Checkout Fluido por SINPE Móvil o WhatsApp</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>El cliente sube su comprobante y el sistema lo valida en 0 segundos.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Mockup Card */}
            <div style={{
              backgroundColor: '#131c2e',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={18} color="#10b981" />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Vista de tu Tienda Online</span>
                </div>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontWeight: 'bold' }}>
                  tienda/tu-marca
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '70px', backgroundColor: '#334155', borderRadius: '8px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
                    📸 Foto
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '2px' }}>Hamburguesa Doble</div>
                  <div style={{ color: '#34d399', fontWeight: '800', fontSize: '0.8rem' }}>₡6.500</div>
                </div>

                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '70px', backgroundColor: '#334155', borderRadius: '8px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
                    📸 Foto
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '2px' }}>Papas Rústicas</div>
                  <div style={{ color: '#34d399', fontWeight: '800', fontSize: '0.8rem' }}>₡2.800</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#064e3b', border: '1px solid #059669', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: '#ecfdf5' }}>
                  🛒 <strong>2 productos</strong>
                </div>
                <div style={{ fontWeight: '800', color: '#a7f3d0', fontSize: '0.9rem' }}>
                  ₡9.300
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================
          4. SPOTLIGHT SECTION 2: AGENDA DE CITAS & RESERVAS (#agenda)
      ============================================================== */}
      <section id="agenda" style={{ padding: isMobile ? '60px 16px' : '90px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '30px' : '50px', alignItems: 'center' }}>
          
          {/* Visual Mockup Card */}
          <div style={{
            backgroundColor: '#131c2e',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            order: isMobile ? 2 : 1,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#a855f7" />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Portal de Reservas Online</span>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#a855f7', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontWeight: 'bold' }}>
                reservas/tu-marca
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>💇‍♂️ <strong>Servicio:</strong> Corte & Barba</span>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>₡12.000</span>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span>📅 <strong>Fecha:</strong> Viernes 29 de Agosto</span>
                <span style={{ color: '#a855f7', fontWeight: 'bold' }}>3:30 PM</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem', color: '#e9d5ff' }}>
              🔔 <strong>Recordatorio Automático:</strong> WhatsApp enviado 2h antes para confirmar asistencia.
            </div>
          </div>

          {/* Text & Benefits */}
          <div style={{ order: isMobile ? 1 : 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '14px' }}>
              <Calendar size={14} /> AGENDA & CITAS EN LÍNEA 24/7
            </div>

            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 14px 0' }}>
              Llena tu Agenda sin Pasar Horas Contestando Llamadas
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Permite que tus clientes elijan servicio, especialista, fecha y hora disponible desde cualquier celular o directamente por WhatsApp, incluso de noche o fines de semana.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                  <Check size={16} color="#c084fc" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '700' }}>Cero Cancelaciones Olvidadas</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Los recordatorios automáticos por WhatsApp reducen el ausentismo en más de un 80%.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                  <Check size={16} color="#c084fc" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '700' }}>Ideal para Todo Tipo de Servicio</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Salones de belleza, barberías, clínicas dentales, talleres mecánicos, consultorios y spas.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==============================================================
          5. SPOTLIGHT SECTION 3: PERSONALIZACIÓN TOTAL (#personalizacion)
      ============================================================== */}
      <section id="personalizacion" style={{ padding: isMobile ? '60px 16px' : '90px 24px', backgroundColor: '#0e1626', borderTop: '1px solid rgba(255,255,255,0.06)', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '14px' }}>
            <Palette size={14} /> IDENTIDAD VISUAL
          </div>

          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: '800', margin: '0 0 12px 0' }}>
            Tu Marca, Tus Colores, Tu Identidad
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '750px', margin: '0 auto 40px auto', padding: '0 8px' }}>
            Betico no es una plataforma genérica. Cada negocio tiene su propia página con su logo, colores de marca, tipografías y banners que lucen espectaculares en celulares y computadoras.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', textAlign: 'left' }}>
            
            <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(236, 72, 153, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Palette size={20} color="#f472b6" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px 0' }}>Paleta de Colores de tu Marca</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Ajusta el color principal, secundario y fondos para que tu tienda y agenda coincidan exactamente con tus colores.
              </p>
            </div>

            <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Building2 size={20} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px 0' }}>Portal de Acceso Exclusivo</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Tu equipo ingresa a través de tu propio portal seguro con tu logo (ej: <code style={{ color: '#34d399' }}>acceso/tu-marca</code>).
              </p>
            </div>

            <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Store size={20} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px 0' }}>Modo Restaurante o Retail</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Cambia entre formato de restaurante (con pedidos QR a la mesa) o catálogo de retail (para tiendas de ropa, productos o servicios).
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================
          6. MÓDULOS DEL SISTEMA (#modulos)
      ============================================================== */}
      <section id="modulos" style={{ padding: isMobile ? '60px 16px' : '90px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800', margin: '0 0 10px 0' }}>
            Módulos Completos para Operar tu Negocio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, padding: '0 8px' }}>
            Herramientas integradas para multiplicar tus ventas y automatizar la operación diaria.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          
          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Headphones size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Notas de Voz & Asistente IA</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Tus clientes no tienen que escribir. Betico escucha notas de voz, extrae pedidos o reservas y responde con fluidez en lenguaje natural tico.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Smartphone size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Validación Instantánea de SINPE Móvil</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Cero fraudes y cero esperas. El lector inteligente confirma transferencias bancarias en 0 segundos y emite campanadas a cocina.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Utensils size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Pantallas de Cocina KDS en Vivo</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Reemplaza comandas de papel por pantallas táctiles con alertas sonoras en tiempo real, cronómetro de preparación y aviso al cliente.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Building2 size={22} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Multi-Sucursal & Franquicias</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Administra todas tus sedes físicas de forma centralizada con inventario, cuentas SINPE y pantallas KDS independientes por local.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <MapPin size={22} color="#f472b6" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Envíos Express GPS & Correos CR</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Cálculo de costo de envío por distancia GPS exacta con navegación Waze para motorizados y tarifas automáticas de Correos de Costa Rica.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(14, 165, 233, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Send size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0' }}>Difusiones Masivas & Marketing</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Envía promociones, ofertas y novedades a tus clientes por WhatsApp con control de cadencia inteligente para proteger tu número.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.1)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Zap size={22} color="#34d399" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0', color: '#ecfdf5' }}>💸 Cero Tarifas Ocultas en Dólares</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Sin pagos extra de $20/mes o más, ni requerimiento de tarjetas internacionales. Tu motor de IA Betico viene 100% incluido y listo para usar en colones.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '24px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.1)' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Store size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 6px 0', color: '#f0f9ff' }}>🌐 Creador de Sitios Web Incluido</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
              Crea la página web oficial de tu negocio con tu logo, colores, textos y enlaces directos para comprar en la tienda online o agendar citas en 1 clic.
            </p>
          </div>

        </div>
      </section>

      {/* ==============================================================
          7. CALCULADORA DE ROI & AHORRO (#roi)
      ============================================================== */}
      <section id="roi" style={{ padding: isMobile ? '60px 16px' : '90px 24px', backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800', margin: '0 0 10px 0' }}>
            Calcula Cuánto Ahorrarás con Betico
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 35px 0', padding: '0 8px' }}>
            Mide cuántas horas de trabajo manual y dinero recuperarás al automatizar tu WhatsApp.
          </p>

          <div style={{ backgroundColor: '#1e293b', padding: isMobile ? '20px 16px' : '36px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '28px' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Mensajes diarios en WhatsApp:</label>
                  <span style={{ color: '#34d399', fontWeight: '800' }}>{dailyMessages} msgs/día</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={dailyMessages}
                  onChange={(e) => setDailyMessages(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Ticket promedio de venta:</label>
                  <span style={{ color: '#34d399', fontWeight: '800' }}>₡{avgTicket.toLocaleString('es-CR')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <Clock size={15} color="#38bdf8" /> Tiempo Ahorrado al Mes
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8' }}>
                  {hoursSavedPerMonth} horas
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Equivalente a más de media jornada de trabajo
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <TrendingUp size={15} color="#34d399" /> Ventas Recuperadas Estimadas
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399' }}>
                  ₡{estimatedRecoveredSales.toLocaleString('es-CR')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Por responder inmediatamente las 24 horas del día
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ==============================================================
          8. PLANES & PRECIOS (#planes)
      ============================================================== */}
      <section id="planes" style={{ padding: isMobile ? '60px 16px' : '90px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800', margin: '0 0 10px 0' }}>
            Planes Claros para Todo Tipo de Negocio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, padding: '0 8px' }}>
            Sin contratos forzosos. Cancela o cambia de plan en cualquier momento.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div style={{ backgroundColor: '#131c2e', padding: isMobile ? '24px' : '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0' }}>Emprendedor</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0' }}>Para negocios que inician en WhatsApp</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '20px' }}>
              $29 <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> 1 Número de WhatsApp Conectado</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Asistente IA 24/7 (Texto)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Tienda Digital / Menú QR</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Agenda de Citas Básica</strong></li>
            </ul>
            <button onClick={onLoginClick} style={{ padding: '12px', backgroundColor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Elegir Emprendedor
            </button>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: isMobile ? '24px' : '32px', borderRadius: '20px', border: '2px solid #10b981', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.3)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '0.72rem', fontWeight: '800', padding: '4px 12px', borderRadius: '9999px' }}>
              MÁS POPULAR
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0' }}>Profesional</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0' }}>Para restaurantes, clínicas y tiendas activas</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '20px' }}>
              $59 <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Audios & Notas de Voz con IA</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Validación Automática de SINPE Móvil</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Tienda Online & Agenda Completa</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Pantalla de Cocina (KDS) en Vivo</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Portal de Repartidores con Waze</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Difusiones Masivas & Promociones</li>
            </ul>
            <button onClick={onLoginClick} style={{ padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              Comenzar con Pro
            </button>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: isMobile ? '24px' : '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0' }}>Franquicias / Multi-Sede</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0' }}>Cadenas y negocios con múltiples locales</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '20px' }}>
              $119 <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Hasta 5 Sucursales Físicas</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Selector de Sede y KDS Aislado por Local</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Todo lo incluido en el Plan Pro</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Soporte Dedicado y Capacitación</li>
            </ul>
            <button onClick={onLoginClick} style={{ padding: '12px', backgroundColor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Solicitar Franquicias
            </button>
          </div>

        </div>
      </section>

      {/* ==============================================================
          9. PREGUNTAS FRECUENTES (#faq)
      ============================================================== */}
      <section id="faq" style={{ padding: isMobile ? '60px 16px' : '90px 24px', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '800', margin: '0 0 10px 0' }}>Preguntas Frecuentes</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, padding: '0 8px' }}>Resolvemos tus dudas sobre cómo funciona Betico.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ paddingRight: '8px' }}>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#10b981" /> : <ChevronDown size={18} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          10. FOOTER
      ============================================================== */}
      <footer style={{
        backgroundColor: '#080c14',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: isMobile ? '40px 16px 24px 16px' : '50px 24px 30px 24px',
        color: '#94a3b8',
        fontSize: '0.85rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
          
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '800', fontSize: '1.15rem', marginBottom: '8px' }}>
              <Bot size={20} color="#10b981" /> Betico.tech
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', fontSize: '0.82rem' }}>
              Plataforma integral con Inteligencia Artificial para ventas, tiendas online, citas y cobros automáticos por WhatsApp en Costa Rica.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>Plataforma</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <a onClick={() => scrollToSection('tienda')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Tienda Online</a>
                <a onClick={() => scrollToSection('agenda')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Agenda & Citas</a>
                <a onClick={() => scrollToSection('personalizacion')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Personalización</a>
                <a onClick={() => scrollToSection('modulos')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Módulos & IA</a>
                <a onClick={() => scrollToSection('planes')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Planes & Precios</a>
              </div>
            </div>

            <div>
              <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>Legal & Acceso</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <a href="/politica-de-privacidad" style={{ color: '#94a3b8', textDecoration: 'none' }}>Política de Privacidad</a>
                <a href="/terminos-y-condiciones" style={{ color: '#94a3b8', textDecoration: 'none' }}>Términos del Servicio</a>
                <button onClick={onLoginClick} style={{ color: '#10b981', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' }}>
                  Acceso al Panel
                </button>
              </div>
            </div>
          </div>

        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem' }}>
          <div>© 2026 Betico.tech. Todos los derechos reservados. San José, Costa Rica.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} color="#10b981" /> Cifrado de nivel bancario AES-256
          </div>
        </div>
      </footer>

    </div>
  );
}
