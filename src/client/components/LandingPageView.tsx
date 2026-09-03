import React, { useState, useEffect } from 'react';
import RegisterModal from './RegisterModal';
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
  Users,
  Globe,
  Layers,
  HelpCircle,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Share2,
  QrCode,
  Sliders,
  DollarSign
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export default function LandingPageView({ onLoginClick, isLoggedIn, onGoToDashboard }: LandingPageProps) {
  // Calculator State
  const [dailyMessages, setDailyMessages] = useState<number>(120);
  const [avgTicket, setAvgTicket] = useState<number>(8500);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedPlanForRegister, setSelectedPlanForRegister] = useState<'pro' | 'enterprise'>('pro');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ROI Calculations
  const formatColones = (num: number) => {
    return '₡' + num.toLocaleString('es-CR');
  };

  // 2.5 min per human response * 30 days
  const horasMes = Math.round((dailyMessages * 2.5 * 30) / 60);
  const jornadas = (horasMes / 8).toFixed(1);
  // ~8% extra sales converted due to <2s response
  const ventasRecuperadas = Math.round(dailyMessages * 30 * 0.08 * avgTicket);

  const faqs = [
    {
      q: '¿Cómo funciona el nuevo Creador de Sitios Web de Betico?',
      a: 'Cada negocio tiene su propio creador visual en el panel donde puede personalizar la portada, colores corporativos, tipografía, logo blanco/oscuro y activar las secciones que necesite. Al guardar, se genera instantáneamente tu enlace web oficial (ej. betico.tech/sitio/tu-negocio) con tu tienda y botón de reservas incluidos.'
    },
    {
      q: '¿Por qué Betico IA no requiere pagar tarifas extras en dólares?',
      a: 'A diferencia de otras soluciones que usan APIs extranjeras y te cobran por cada mensaje o token consumido, Betico opera su propia infraestructura de IA soberana. Esto nos permite ofrecer respuestas ilimitadas sin que tu factura aumente según el volumen de mensajes.'
    },
    {
      q: '¿Necesito cambiar mi número de WhatsApp actual?',
      a: 'No. Puedes conectar el mismo número comercial que ya tienes activo mediante código QR en menos de 2 minutos. Tus contactos, chats existentes y fotos de perfil se mantienen intactos.'
    },
    {
      q: '¿Cómo funciona la verificación automática de SINPE Móvil?',
      a: 'Cuando un cliente envía una captura del comprobante de SINPE Móvil, nuestro módulo de Visión Artificial escanea automáticamente el número de comprobante, el banco de origen, la fecha, el destinatario y el monto exacto, validándolo al instante sin que tengas que pausar tu trabajo para revisar tu teléfono personal.'
    },
    {
      q: '¿Cómo funciona el cobro con Tarjetas de Crédito y Débito en Betico?',
      a: 'Gracias a nuestra integración nativa con Tilopay, tus clientes pueden pagar con Visa, Mastercard y AMEX mediante pasarela con protocolo 3D Secure 2.0. El dinero de las compras se liquida de manera transparente directamente a tu cuenta bancaria nacional (IBAN).'
    },
    {
      q: '¿Es seguro para mi negocio aceptar pagos con tarjeta? ¿Hay riesgo de fraude o contracargos?',
      a: 'Totalmente seguro. El estándar bancario 3D Secure exige una validación de dos factores al tarjetahabiente (código SMS OTP o confirmación en su app bancaria), lo que transfiere la responsabilidad de fraude al banco emisor y elimina casi por completo los intentos de contracargos fraudulentos.'
    },
    {
      q: '¿El asistente entiende notas de voz y modismos costarricenses?',
      a: 'Sí. Betico procesa y transcribe audios de voz de cualquier duración y comprende expresiones locales como "pura vida", "a cachete", "brete", "señas de SINPE", horarios en lenguaje natural y nombres de cantones o distritos en Costa Rica.'
    },
    {
      q: '¿La tienda online, pasarelas de pago y agenda de citas tienen costo adicional?',
      a: 'No. Todo está unificado en una sola tarifa plana mensual en colones (₡55.000 para el plan Pro). No cobramos comisiones por pedido procesado en Betico ni cobros adicionales por citas agendadas.'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#FAF8F5',
      color: '#1e293b',
      fontFamily: "'Poppins', sans-serif",
      minHeight: '100vh',
      position: 'relative'
    }}>

      {/* ==============================================================
          1. HEADER & NAVIGATION BAR
      ============================================================== */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo Oficial Único (Máximo Protagonismo) */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, padding: '4px 0' }}
          >
            <img
              src="/logo.png"
              alt="Betico"
              style={{ height: '54px', width: 'auto', objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }}
            />
          </a>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '0.88rem', fontWeight: '600', color: '#475569' }}>
              <a onClick={() => scrollToSection('superpoderes')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>4 Superpoderes</a>
              <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#b51c12', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e0352b' }} />
                Pagos Tarjeta
              </a>
              <a onClick={() => scrollToSection('sitio-web')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web</a>
              <a onClick={() => scrollToSection('motor-ia')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Motor IA</a>
              <a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Tienda & Citas</a>
              <a onClick={() => scrollToSection('calculadora-roi')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Calculadora ROI</a>
              <a onClick={() => scrollToSection('precios')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Precios</a>
            </nav>
          )}

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                style={{
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(11, 60, 61, 0.25)'
                }}
              >
                <ArrowRight size={16} />
                <span>Ir al Panel</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    background: 'transparent',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: isMobile ? 'none' : 'inline-block'
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanForRegister('pro');
                    setShowRegisterModal(true);
                  }}
                  style={{
                    backgroundColor: '#0b3c3d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(11, 60, 61, 0.22)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={16} />
                  <span>Comenzar Prueba Gratis</span>
                </button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Abrir Menú"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 20px 30px rgba(0,0,0,0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.92rem',
            fontWeight: '600'
          }}>
            <a onClick={() => scrollToSection('superpoderes')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>⚡ 4 Superpoderes de Betico</a>
            <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#b51c12', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>💳 Pagos Tarjeta (Tilopay 3D Secure)</a>
            <a onClick={() => scrollToSection('sitio-web')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🌐 Creador de Sitios Web</a>
            <a onClick={() => scrollToSection('motor-ia')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🤖 Motor de IA Propio</a>
            <a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🛍️ Tienda & Agenda de Citas</a>
            <a onClick={() => scrollToSection('calculadora-roi')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>💰 Calculadora de Ahorro</a>
            <a onClick={() => scrollToSection('precios')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🏷️ Planes & Precios</a>
            <a onClick={onLoginClick} style={{ color: '#0b3c3d', padding: '8px 0', fontWeight: 'bold' }}>🔑 Iniciar Sesión</a>
          </div>
        )}
      </header>

      {/* ==============================================================
          2. MAIN CONTENT WRAPPER
      ============================================================== */}
      <main style={{ paddingTop: '80px' }}>

        {/* ------------------------------------------------------------
            HERO SECTION
        ------------------------------------------------------------ */}
        <section style={{
          padding: isMobile ? '50px 16px 60px 16px' : '90px 24px 90px 24px',
          background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 50%, #F8FAFC 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Accent Glows */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '800px', height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(11,60,61,0.08) 0%, rgba(240,67,55,0.05) 50%, transparent 80%)',
            filter: 'blur(60px)', pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
            
            {/* Launch Badge Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              backgroundColor: '#fff1f0',
              border: '1px solid #ffc7c4',
              borderRadius: '9999px',
              color: '#b51c12',
              fontSize: isMobile ? '0.78rem' : '0.88rem',
              fontWeight: '700',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(240, 67, 55, 0.08)'
            }}>
              <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f04337', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b51c12' }} />
              </span>
              <span>⚡ Nuevo: Pagos con Tarjeta 3D Secure (Tilopay) + SINPE con Visión + Motor IA Propio</span>
            </div>

            {/* Hero Headline */}
            <h1 style={{
              fontSize: 'clamp(2.1rem, 5.5vw, 4.2rem)',
              fontWeight: '900',
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: '0 0 20px 0',
              maxWidth: '1000px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Tu Sitio Web Oficial, Tienda, Citas e IA en{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0b3c3d 0%, #134b4c 45%, #b51c12 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                un Solo Lugar
              </span>
            </h1>

            {/* Hero Description */}
            <p style={{
              fontSize: 'clamp(1rem, 2.3vw, 1.25rem)',
              color: '#475569',
              lineHeight: 1.65,
              maxWidth: '820px',
              margin: '0 auto 36px auto',
              fontWeight: 400
            }}>
              Crea tu <strong>Página Web Oficial</strong> en minutos, vende en tu <strong>Tienda Digital</strong> con cobros por <strong>Tarjeta (Visa, Mastercard, AMEX)</strong> y <strong>SINPE Móvil</strong>, llena tu <strong>Agenda de Citas</strong> y automatiza la atención 24/7 por WhatsApp con <strong>Betico IA</strong>.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '56px'
            }}>
              <button
                onClick={() => {
                  setSelectedPlanForRegister('pro');
                  setShowRegisterModal(true);
                }}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '700',
                  padding: '16px 32px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(11, 60, 61, 0.28)',
                  transition: 'all 0.2s'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Comenzar Prueba Gratis (15 Días)</span>
              </button>

              <a
                href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20probar%20la%20demo"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  fontWeight: '700',
                  padding: '16px 28px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
              >
                <MessageSquare size={18} color="#b51c12" />
                <span>Probar Demo en WhatsApp</span>
              </a>
            </div>

            {/* HERO SHOWCASE: CLIENT FLOW IN COSTA RICA */}
            <div style={{
              maxWidth: '920px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
              overflow: 'hidden',
              textAlign: 'left'
            }}>
              {/* Simulated Browser Bar */}
              <div style={{
                backgroundColor: '#002526',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#cbd5e1',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f04337' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ marginLeft: '8px', fontWeight: '600', color: '#f8fafc' }}>
                    Demostración en Tiempo Real • WhatsApp & SINPE Visión
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
                  <span style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: '0.75rem' }}>Motor Activo: 0.8s</span>
                </div>
              </div>

              {/* Chat Simulation Canvas */}
              <div style={{ padding: isMobile ? '16px' : '26px', backgroundColor: '#FAF8F5', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Voice Note From Client */}
                <div style={{ alignSelf: 'flex-end', maxWidth: isMobile ? '92%' : '75%', backgroundColor: '#0b3c3d', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', fontSize: '0.88rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', fontSize: '0.76rem', color: '#b0dcdc' }}>
                    <Volume2 size={15} />
                    <span>Nota de Voz del Cliente (0:07)</span>
                  </div>
                  <div style={{ fontStyle: 'italic', fontWeight: '300' }}>
                    “¡Buenas! Quiero pedir una Hamburguesa Especial con papas y reservar cita para las 3:00pm”
                  </div>
                </div>

                {/* Betico Native AI Response */}
                <div style={{ alignSelf: 'flex-start', maxWidth: isMobile ? '94%' : '80%', backgroundColor: '#ffffff', color: '#0f172a', padding: '16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.88rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0b3c3d', fontWeight: '800', fontSize: '0.82rem', marginBottom: '8px' }}>
                    <Bot size={16} color="#b51c12" />
                    <span>Betico IA (Motor Propio sin costos de token)</span>
                  </div>
                  <p style={{ margin: '0 0 8px 0' }}>¡Hola! Con gusto te tomo la orden 🍔</p>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• 1x Hamburguesa Especial con papas</span>
                      <strong style={{ color: '#0f172a' }}>₡5.500</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0b3c3d', fontWeight: '600' }}>
                      <span>• Cita programada para hoy</span>
                      <span>3:00 PM ⏰</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                    ¿Deseas pagar por <strong>SINPE Móvil</strong> o <strong>Tarjeta de Crédito/Débito</strong>?
                  </p>
                </div>

                {/* Side-by-Side Dual Payment Validations */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', paddingTop: '6px' }}>
                  
                  {/* SINPE Vision Validation */}
                  <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '2px solid rgba(11,60,61,0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <QrCode size={20} />
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>SINPE Móvil Validado por Visión</span>
                        <CheckCircle2 size={14} color="#0b3c3d" />
                      </div>
                      <div style={{ color: '#64748b', marginTop: '2px', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                        Monto confirmado: <strong style={{ color: '#0b3c3d' }}>₡5.500</strong> • Ref #893012
                      </div>
                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: '#0b3c3d', backgroundColor: '#eff7f7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', border: '1px solid #b0dcdc' }}>
                        ✓ Pedido confirmado y cita agendada
                      </span>
                    </div>
                  </div>

                  {/* 3D Secure Card Payment */}
                  <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '2px solid rgba(240,67,55,0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fff1f0', color: '#b51c12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CreditCard size={20} />
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Pago Aprobado (Tilopay 3D Secure)</span>
                        <ShieldCheck size={14} color="#b51c12" />
                      </div>
                      <div style={{ color: '#64748b', marginTop: '2px', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                        Monto: <strong style={{ color: '#0f172a' }}>₡5.500</strong> • Aut: BAC-948210
                      </div>
                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: '#b51c12', backgroundColor: '#fff1f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', border: '1px solid #ffc7c4' }}>
                        ✓ Verificado en 0s con banco del cliente
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            TRUST STRIP
        ------------------------------------------------------------ */}
        <section style={{ padding: '24px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '40px',
            color: '#64748b',
            fontSize: '0.82rem',
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#0b3c3d" />
              <span>Protocolo Bancario 3D Secure 2.0</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#0b3c3d" />
              <span>Liquidación Directa a Bancos de Costa Rica</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#b51c12" />
              <span>Motor IA propio sin cobro por tokens</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#0b3c3d" />
              <span>Comprobantes SINPE Móvil Verificados</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            3. LOS 4 PILARES FUNDAMENTALES (SUPERPODERES)
        ------------------------------------------------------------ */}
        <section id="superpoderes" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 60px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', backgroundColor: '#fff1f0', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #ffc7c4', display: 'inline-block', marginBottom: '12px' }}>
                Plataforma Todo en Uno
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
                Los 4 Pilares Fundamentales de Betico
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Todo lo que tu negocio necesita para operar, vender y fidelizar clientes sin pagar múltiples herramientas separadas.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px' }}>
              
              {/* Pilar 1: Creador de Sitios Web */}
              <div id="sitio-web" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: isMobile ? '24px' : '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Globe size={26} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#0b3c3d', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0b3c3d' }} />
                    Pilar 1
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                    Creador de Sitios Web Oficiales
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Diseña la página web oficial de tu negocio (<span style={{ fontFamily: 'monospace', color: '#0b3c3d', fontWeight: '600' }}>betico.tech/sitio/tu-marca</span>) en minutos. Elige estilo dividido o con imagen cover, sube tu logo para fondos claros y oscuros, define colores y activa los botones directos a tienda y reservas.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Enlace web oficial listo para poner en tu biografía de Instagram o TikTok.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Logo adaptable automático para fondos claros y footer oscuro.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Control de visibilidad de secciones (Sobre Nosotros, Servicios, Reseñas).</span>
                    </li>
                  </ul>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Hosting y Certificado SSL Incluido</span>
                  <span style={{ color: '#0b3c3d', fontWeight: '700' }}>100% Responsivo</span>
                </div>
              </div>

              {/* Pilar 2: Motor de IA Propio */}
              <div id="motor-ia" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: isMobile ? '24px' : '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fff1f0', color: '#b51c12', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Bot size={26} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#b51c12', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b51c12' }} />
                    Pilar 2
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                    Motor de IA Betico Propio
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    <strong>Cero Tarifas Ocultas en Dólares:</strong> Sin pagos extra de $20+/mes ni requerimiento de tarjetas internacionales. Contesta mensajes y notas de voz 24/7 en WhatsApp, genera descripciones para tu catálogo y atiende clientes sin límites de tokens ni cobros extras.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Tus datos están seguros y no se usan para entrenar modelos de grandes empresas.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Generación automática de títulos y descripciones atractivas para tu catálogo.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Historial y métricas de asistencias brindadas sin cobros por tokens.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Entrenado con modismos ticos</span>
                  <span style={{ color: '#b51c12', fontWeight: '700' }}>IA Nativa Betico</span>
                </div>
              </div>

              {/* Pilar 3: Tienda Digital & Pasarela Multicanal */}
              <div id="tienda-citas" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: isMobile ? '24px' : '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <ShoppingBag size={26} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#0b3c3d', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0b3c3d' }} />
                    Pilar 3
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                    Tienda Digital & Pasarela Multicanal
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Catálogo interactivo con carrito de compras, cobro en línea con <strong>Tarjetas de Crédito y Débito</strong> (Visa, Mastercard, AMEX) vía Tilopay 3D Secure, validación instantánea de <strong>SINPE Móvil</strong> con Visión Artificial y gestión de envíos express por GPS.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Pasarela oficial de Tarjetas de Crédito y Débito con Tilopay 3D Secure.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Verificación instantánea de comprobantes SINPE Móvil sin abrir tu banco.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Pantalla de Cocina (KDS), portal de repartidores y descuento de stock en tiempo real.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Checkout Todo en Uno</span>
                  <span style={{ color: '#0b3c3d', fontWeight: '700' }}>Visa • MC • AMEX • SINPE</span>
                </div>
              </div>

              {/* Pilar 4: Agenda de Citas 24/7 */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: isMobile ? '24px' : '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Calendar size={26} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#334155', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#334155' }} />
                    Pilar 4
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                    Agenda de Citas & Reservas 24/7
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Permite a tus clientes agendar citas por WhatsApp o desde tu portal web de reservas. Asignación automática por especialista o colaborador, control de horarios y recordatorios automáticos para eliminar inasistencias.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Recordatorios automáticos por WhatsApp 24h y 2h antes de la cita.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Portal exclusivo para especialistas con su propia agenda de trabajo.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Cobro de anticipos o señas mediante SINPE Móvil o Tarjeta.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Recordatorios WhatsApp</span>
                  <span style={{ color: '#0f172a', fontWeight: '700' }}>0% Citas Olvidadas</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            4. PASARELA DE TARJETAS Y RESPALDO BANCARIO 3D SECURE
        ------------------------------------------------------------ */}
        <section id="pagos-tarjeta" style={{ padding: isMobile ? '60px 16px' : '90px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: isMobile ? '40px' : '60px', alignItems: 'center' }}>
              
              {/* Text & Features */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#fff1f0', color: '#b51c12', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid #ffc7c4', marginBottom: '16px' }}>
                  <ShieldCheck size={16} />
                  <span>Nuevo Superpoder • Pasarela de Tarjetas Tilopay</span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: '900', color: '#0f172a', lineHeight: 1.18, letterSpacing: '-0.5px', margin: '0 0 18px 0' }}>
                  Acepta <span style={{ color: '#0b3c3d' }}>Tarjetas de Crédito y Débito</span> con Respaldo Bancario 3D Secure
                </h2>

                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.65, marginBottom: '24px' }}>
                  Multiplica tus ventas permitiendo que tus clientes paguen en segundos con cualquier tarjeta bancaria nacional o internacional. Integración oficial con <strong>Tilopay</strong> y homologación con los principales bancos de Costa Rica, con depósito directo a tu cuenta bancaria y blindaje antifraude.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <ShieldCheck size={18} color="#0b3c3d" />
                      <span>Protección 3D Secure 2.0</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Autenticación OTP con BAC, BCR, BNCR, Scotiabank y Promerica. Cero contracargos y máxima confianza.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Zap size={18} color="#0b3c3d" />
                      <span>Verificación Inmediata</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      El pago se acredita al segundo, el stock se descuenta en BD y la cocina o almacén recibe la comanda lista.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Building2 size={18} color="#b51c12" />
                      <span>Directo a tu Banco</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Sin intermediarios reteniendo tu dinero. Las ventas en colones o dólares se depositan en tu propia cuenta.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Store size={18} color="#0b3c3d" />
                      <span>Checkout Todo en Uno</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Tarjetas bancarias + SINPE Móvil con Visión IA + Transferencias + Contra Entrega en una sola experiencia.
                    </p>
                  </div>
                </div>

                {/* Supported Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: '700', color: '#334155' }}>Tarjetas y Redes Soportadas:</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>VISA</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>Mastercard</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>American Express</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#eff7f7', borderRadius: '6px', fontWeight: '700', color: '#0b3c3d', border: '1px solid #b0dcdc' }}>SINPE Móvil</span>
                </div>
              </div>

              {/* Graphic Card Visual Showcase */}
              <div>
                <div style={{
                  backgroundColor: '#002526',
                  color: 'white',
                  borderRadius: '24px',
                  padding: isMobile ? '20px' : '28px',
                  boxShadow: '0 25px 50px -12px rgba(0, 37, 38, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f04337' }} />
                      <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Pasarela Segura Tilopay</span>
                    </div>
                    <span style={{ backgroundColor: '#0b3c3d', color: '#b0dcdc', padding: '3px 10px', borderRadius: '9999px', fontFamily: 'monospace', fontSize: '0.72rem', border: '1px solid rgba(176,220,220,0.3)' }}>
                      PCI-DSS Nivel 1
                    </span>
                  </div>

                  {/* Simulated Bank Card */}
                  <div style={{
                    marginTop: '20px',
                    background: 'linear-gradient(135deg, #0b3c3d 0%, #134b4c 60%, #072e2f 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b0dcdc' }}>Pasarela Bancaria</span>
                        <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '2px' }}>•••• •••• •••• 4281</p>
                      </div>
                      <span style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', color: '#ffc7c4' }}>VISA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#b0dcdc', display: 'block' }}>Titular</span>
                        <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>CLIENTE VERIFICADO</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#b0dcdc', display: 'block' }}>Vencimiento</span>
                        <span style={{ fontFamily: 'monospace' }}>12/28</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Orden Comercial:</span>
                      <strong style={{ color: 'white' }}>#ORD-104</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Monto Acreditado:</span>
                      <strong style={{ color: '#ffc7c4', fontSize: '0.92rem' }}>₡14.500</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Estado del Pago:</span>
                      <span style={{ color: '#b0dcdc', backgroundColor: '#0b3c3d', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1a5f60' }}>
                        ✓ Cancelado con Tarjeta (Tilopay)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingTop: '2px' }}>
                      <span>Impacto en Tienda:</span>
                      <span>📦 Stock Descontado en 0s</span>
                    </div>
                  </div>

                  {/* Conversion Tip */}
                  <div style={{ marginTop: '18px', backgroundColor: 'rgba(11,60,61,0.6)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(176,220,220,0.2)', fontSize: '0.76rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#ffc7c4" style={{ flexShrink: 0 }} />
                    <span><strong>Dato de Conversión:</strong> Ofrecer tarjeta bancaria junto a SINPE reduce el abandono de carritos hasta un <strong>35%</strong>.</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            5. CALCULADORA INTERACTIVA DE ROI
        ------------------------------------------------------------ */}
        <section id="calculadora-roi" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', backgroundColor: '#eff7f7', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #b0dcdc', display: 'inline-block', marginBottom: '12px' }}>
                Calcula tu Retorno de Inversión
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 12px 0' }}>
                ¿Cuánto Dinero y Horas Ahorrarás con Betico?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.98rem', margin: 0 }}>
                Mueve los deslizadores según el volumen de mensajes y ticket promedio de tu negocio.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: isMobile ? '24px' : '40px', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(0,0,0,0.04)' }}>
              
              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
                
                {/* Slider 1: Mensajes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="#0b3c3d" />
                      <span>Mensajes recibidos al día:</span>
                    </label>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0b3c3d', fontFamily: 'monospace', backgroundColor: '#eff7f7', padding: '4px 12px', borderRadius: '8px', border: '1px solid #b0dcdc' }}>
                      {dailyMessages} msgs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="800"
                    step="10"
                    value={dailyMessages}
                    onChange={(e) => setDailyMessages(parseInt(e.target.value))}
                    style={{ width: '100%', height: '8px', borderRadius: '6px', appearance: 'none', backgroundColor: '#e2e8f0', accentColor: '#0b3c3d', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                    <span>20 msgs/día</span>
                    <span>400 msgs/día</span>
                    <span>800 msgs/día</span>
                  </div>
                </div>

                {/* Slider 2: Ticket Promedio */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} color="#b51c12" />
                      <span>Ticket promedio de venta:</span>
                    </label>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#b51c12', fontFamily: 'monospace', backgroundColor: '#fff1f0', padding: '4px 12px', borderRadius: '8px', border: '1px solid #ffc7c4' }}>
                      {formatColones(avgTicket)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="60000"
                    step="500"
                    value={avgTicket}
                    onChange={(e) => setAvgTicket(parseInt(e.target.value))}
                    style={{ width: '100%', height: '8px', borderRadius: '6px', appearance: 'none', backgroundColor: '#e2e8f0', accentColor: '#b51c12', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                    <span>₡2.000</span>
                    <span>₡30.000</span>
                    <span>₡60.000</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Results Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                
                {/* Hours Saved */}
                <div style={{ background: 'linear-gradient(135deg, #eff7f7 0%, #ffffff 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #b0dcdc' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', display: 'block', marginBottom: '6px' }}>
                    Tiempo de Atención Ahorrado
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: '900', color: '#0b3c3d', letterSpacing: '-0.5px' }}>
                      {horasMes} Horas
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#072e2f', fontWeight: '600' }}>/ mes</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                    Equivalente a <strong style={{ color: '#0f172a' }}>{jornadas} jornadas laborales completas</strong> recuperadas.
                  </p>
                </div>

                {/* Recovered Revenue */}
                <div style={{ background: 'linear-gradient(135deg, #002526 0%, #0b3c3d 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #072e2f', color: 'white' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffc7c4', display: 'block', marginBottom: '6px' }}>
                    Ventas Estimadas Recuperadas
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                      {formatColones(ventasRecuperadas)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>/ mes</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Por respuestas inmediatas en menos de 2 segundos en horario nocturno y festivo.
                  </p>
                </div>

              </div>

              <div style={{ marginTop: '28px', textAlign: 'center' }}>
                <a
                  href="#precios"
                  onClick={(e) => { e.preventDefault(); scrollToSection('precios'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '700', color: '#0b3c3d', textDecoration: 'none' }}
                >
                  <span>Descubre cómo comenzar con Betico hoy</span>
                  <ArrowRight size={16} />
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            6. PRECIOS Y PLANES EN COLONES
        ------------------------------------------------------------ */}
        <section id="precios" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 60px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', backgroundColor: '#fff1f0', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #ffc7c4', display: 'inline-block', marginBottom: '12px' }}>
                Precios Transparentes en Colones
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
                Planes Todo Incluido con 15 Días de Prueba Gratis
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Comienza a operar hoy mismo sin tarjeta de crédito. Paga en colones por SINPE Móvil o transferencia. Sin cobros sorpresa en dólares.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px', maxWidth: '1000px', margin: '0 auto', alignItems: 'stretch' }}>
              
              {/* Plan Betico Pro (Destacado) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '28px 20px' : '38px 30px',
                border: '2px solid #0b3c3d',
                boxShadow: '0 12px 36px rgba(11, 60, 61, 0.12)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  position: 'absolute', top: '-14px', left: '32px',
                  backgroundColor: '#b51c12', color: 'white', fontSize: '0.75rem', fontWeight: '800',
                  padding: '4px 14px', borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 2px 6px rgba(181, 28, 18, 0.3)'
                }}>
                  15 Días de Prueba Gratis
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingTop: '4px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>Plan Betico Pro</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Para todo comercio que busca vender y agendar en automático.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '20px 0' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '900', color: '#0b3c3d', letterSpacing: '-1px' }}>₡55.000</span>
                    <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: '600' }}>/ mes</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.88rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>1 Número de WhatsApp</strong> Conectado</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Motor Betico IA Propio</strong> (Respuestas ilimitadas, sin cobro por tokens)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Comprensión de Notas de Voz</strong> de WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Creador de Sitios Web Oficial</strong> (<span style={{ color: '#0b3c3d', fontFamily: 'monospace' }}>betico.tech/sitio/tu-marca</span>)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Tienda Online & Menú</strong> con pedidos a WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Pasarela de Tarjetas Débito y Crédito</strong> (Tilopay 3D Secure incluida)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Agenda de Citas & Reservas 24/7</strong> con recordatorios</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Verificación SINPE Móvil con Visión Artificial</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Portal de Repartidores & Asignación por GPS (1 Local)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Pantalla de Cocina (KDS) & Difusión Masiva CRM</span></li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForRegister('pro');
                    setShowRegisterModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#0b3c3d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(11, 60, 61, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={18} />
                  <span>Comenzar Prueba Gratis (15 Días)</span>
                </button>
              </div>

              {/* Plan Betico Empresa */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '28px 20px' : '38px 30px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>Plan Betico Empresa</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Para franquicias, cadenas y negocios con múltiples sucursales.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '20px 0' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>₡85.000</span>
                    <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: '600' }}>/ mes</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.88rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Todo lo incluido en Plan Betico Pro</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Múltiples Sucursales o Sedes</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Enrutamiento Inteligente de Pedidos por GPS</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Pantallas KDS y Repartidores Independientes por Sede</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Cuentas SINPE y Bancos Separados por Local</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Acceso para Múltiples Administradores y Roles</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Soporte Prioritario VIP 24/7 por WhatsApp</strong></span></li>
                  </ul>
                </div>

                <a
                  href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20conocer%20el%20Plan%20Empresa"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#002526',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxSizing: 'border-box'
                  }}
                >
                  <Building2 size={18} />
                  <span>Probar Plan Empresa Gratis</span>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            7. PREGUNTAS FRECUENTES (FAQ ACORDEÓN)
        ------------------------------------------------------------ */}
        <section style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', backgroundColor: '#eff7f7', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #b0dcdc', display: 'inline-block', marginBottom: '12px' }}>
                Despeja tus Dudas
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
                Preguntas Frecuentes
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        padding: '18px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: isOpen ? '#0b3c3d' : '#0f172a',
                        transition: 'color 0.2s'
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        color={isOpen ? '#0b3c3d' : '#94a3b8'}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          flexShrink: 0
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 24px 20px 24px',
                        fontSize: '0.88rem',
                        lineHeight: 1.65,
                        color: '#475569',
                        borderTop: '1px solid #f1f5f9'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            8. PRE-FOOTER CALL TO ACTION
        ------------------------------------------------------------ */}
        <section style={{
          padding: isMobile ? '60px 20px' : '80px 24px',
          backgroundColor: '#002526',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', backgroundColor: 'rgba(240, 67, 55, 0.2)', color: '#ffc7c4', fontSize: '0.78rem', fontWeight: '700', borderRadius: '9999px', border: '1px solid rgba(240, 67, 55, 0.3)', marginBottom: '16px' }}>
              Prueba Gratuita de 15 Días • Sin Compromiso
            </span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
              Empieza a automatizar tu negocio hoy mismo
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 32px auto', fontWeight: 300 }}>
              Configura tu sitio web oficial, conecta tu WhatsApp, activa pagos con tarjeta y SINPE Móvil en menos de 15 minutos.
            </p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <button
                onClick={() => {
                  setSelectedPlanForRegister('pro');
                  setShowRegisterModal(true);
                }}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#b51c12',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(181, 28, 18, 0.3)'
                }}
              >
                <span>Crear Cuenta Gratis</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20hablar%20con%20un%20asesor"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: '1px solid #1a5f60',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  padding: '14px 26px',
                  borderRadius: '12px',
                  textDecoration: 'none'
                }}
              >
                <MessageSquare size={16} color="#ffc7c4" />
                <span>Hablar con un Asesor</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ==============================================================
          9. FOOTER COMPLETO
      ============================================================== */}
      <footer style={{ backgroundColor: '#ffffff', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr 1.2fr', gap: isMobile ? '32px' : '40px', paddingBottom: '48px', borderBottom: '1px solid #e2e8f0' }}>
            
            {/* Logo & Bio (Máximo Protagonismo) */}
            <div>
              <div style={{ marginBottom: '18px' }}>
                <img src="/logo.png" alt="Betico" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, maxWidth: '300px', margin: '0 0 16px 0' }}>
                La plataforma SaaS costarricense que une tu sitio web oficial, tienda digital, agenda de citas y motor de IA en WhatsApp.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #b0dcdc' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0b3c3d' }} />
                <span>Sistema 100% Operativo</span>
              </div>
            </div>

            {/* 4 Superpoderes */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                4 Superpoderes
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <li><a onClick={() => scrollToSection('sitio-web')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web Oficial</a></li>
                <li><a onClick={() => scrollToSection('motor-ia')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Motor Betico IA</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tienda Digital & Tarjetas</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Agenda de Citas 24/7</a></li>
                <li><a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Validación SINPE con Visión</a></li>
              </ul>
            </div>

            {/* Legal & Soporte */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                Legal & Soporte
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <li><a href="/legal/privacidad" style={{ color: '#64748b', textDecoration: 'none' }}>Política de Privacidad</a></li>
                <li><a href="/legal/terminos" style={{ color: '#64748b', textDecoration: 'none' }}>Términos de Servicio</a></li>
                <li><a href="/legal/seguridad" style={{ color: '#64748b', textDecoration: 'none' }}>Seguridad de Datos</a></li>
                <li><a onClick={onLoginClick} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Acceso al Panel</a></li>
              </ul>
            </div>

            {/* Ubicación y Contacto */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                Atención & Contacto
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                San José, Costa Rica 🇨🇷<br />
                Soporte técnico directo vía WhatsApp y correo electrónico.
              </p>
              <div style={{ fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>Email: </span>
                <a href="mailto:soporte@betico.tech" style={{ color: '#0b3c3d', fontWeight: '600', textDecoration: 'none' }}>
                  soporte@betico.tech
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div style={{ paddingTop: '28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} Betico.tech. Todos los derechos reservados.</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Desarrollado con orgullo en Costa Rica</span>
              <span style={{ fontSize: '1rem' }}>🇨🇷</span>
            </p>
          </div>

        </div>
      </footer>

      {/* ------------------------------------------------------------
          10. REGISTRATION MODAL
      ------------------------------------------------------------ */}
      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          initialPlan={selectedPlanForRegister}
        />
      )}

    </div>
  );
}
