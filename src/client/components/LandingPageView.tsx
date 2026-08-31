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
  Share2
} from 'lucide-react';

// Official Vector Brand SVGs
const WhatsAppIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.45c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7 2.46 1.06 2.46.71 2.9.66.44-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.11-.22-.17-.47-.3z"/>
  </svg>
);

const FacebookIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.83c0 1.34-.33 2.74-1.07 3.86-.88 1.35-2.29 2.37-3.87 2.8-1.57.43-3.3.31-4.79-.38-1.5-.68-2.75-1.89-3.48-3.38-.74-1.49-.86-3.27-.37-4.87.5-1.6 1.63-2.99 3.1-3.84 1.48-.86 3.28-1.12 4.95-.78v4.21c-.88-.28-1.88-.2-2.67.24-.78.44-1.32 1.25-1.44 2.14-.13.89.19 1.83.84 2.45.65.62 1.61.85 2.48.61.88-.24 1.59-.96 1.83-1.83.13-.48.18-.98.18-1.48V.02h.01z"/>
  </svg>
);

interface LandingPageProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export default function LandingPageView({ onLoginClick, isLoggedIn, onGoToDashboard }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPlanForRegister, setSelectedPlanForRegister] = useState<'pro' | 'enterprise'>('pro');
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
      q: '¿Cómo funciona el nuevo Creador de Sitios Web de Betico?',
      a: 'Cada negocio tiene su propio creador visual en el panel donde puede personalizar la portada, colores corporativos, tipografía, logo blanco/oscuro y activar las secciones que necesite. Al guardar, se genera instantáneamente tu enlace web oficial (ej. betico.tech/sitio/tu-negocio) con tu tienda y botón de reservas incluidos.'
    },
    {
      q: '¿Por qué Betico IA no requiere pagar tarifas extras en dólares?',
      a: 'A diferencia de otras soluciones que te exigen comprar licencias de OpenAI o pagar $20/mes adicionales por usuario, Betico cuenta con su propio motor de Inteligencia Artificial integrado, seguro y optimizado para Costa Rica, sin cargos ocultos ni necesidad de tarjetas internacionales.'
    },
    {
      q: '¿Necesito cambiar mi número de WhatsApp actual?',
      a: 'No. Puedes conectar tu número de WhatsApp existente (personal o Business) simplemente escaneando un código QR desde la aplicación de WhatsApp en tu teléfono en menos de 1 minuto.'
    },
    {
      q: '¿Cómo funciona la verificación automática de SINPE Móvil?',
      a: 'Cuando un cliente envía una captura de su comprobante bancario por WhatsApp o en la tienda online, la Inteligencia Artificial con Visión analiza el comprobante en tiempo real, verifica el monto, la referencia y el teléfono de destino, y marca el pedido como pagado al instante sin que tengas que revisar tu app bancaria manualmente.'
    },
    {
      q: '¿El asistente entiende notas de voz y modismos costarricenses?',
      a: 'Sí. Betico IA reconoce notas de voz, audios rápidos y expresiones comunes de Costa Rica ("pura vida", "mae", "a nombre de", "sinpe", "para llevar", etc.) y responde en texto formateado en menos de 1.5 segundos.'
    },
    {
      q: '¿La tienda online y la agenda de citas tienen costo adicional?',
      a: 'No, vienen 100% incluidas en tu suscripción de Betico. Puedes activar tanto la tienda online para vender productos como la agenda de citas para servicios, con tu propio enlace personalizado y sin comisiones por venta.'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#080d1a',
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
        backgroundColor: 'rgba(8, 13, 26, 0.94)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}>
              <Bot size={24} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.5px', color: 'white' }}>
                Betico<span style={{ color: '#10b981' }}>.tech</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '0.9rem', fontWeight: '600' }}>
              <a onClick={() => scrollToSection('pilares')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>4 Superpoderes</a>
              <a onClick={() => scrollToSection('website-builder')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web Oficial</a>
              <a onClick={() => scrollToSection('betico-ia')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Betico IA Propia</a>
              <a onClick={() => scrollToSection('tienda-agenda')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Tienda & Citas</a>
              <a onClick={() => scrollToSection('roi')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Calculadora</a>
              <a onClick={() => scrollToSection('planes')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Planes</a>
              <a onClick={() => scrollToSection('faq')} style={{ color: '#cbd5e1', textDecoration: 'none', cursor: 'pointer' }}>Preguntas</a>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard || (() => { window.location.href = '/panel'; })}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Zap size={17} /> Ir a mi Panel
              </button>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: 'transparent',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '9px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
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
                      padding: '9px 16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      borderRadius: '9px',
                      textDecoration: 'none',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <WhatsAppIcon size={16} color="white" /> Probar Demo
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
            marginTop: '14px',
            padding: '18px',
            backgroundColor: '#0f172a',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontSize: '0.95rem',
            fontWeight: '600'
          }}>
            <a onClick={() => scrollToSection('pilares')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>⚡ 4 Superpoderes de Betico</a>
            <a onClick={() => scrollToSection('website-builder')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🌐 Creador de Sitios Web</a>
            <a onClick={() => scrollToSection('betico-ia')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🤖 Motor de IA Propio</a>
            <a onClick={() => scrollToSection('tienda-agenda')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🛍️ Tienda & Agenda de Citas</a>
            <a onClick={() => scrollToSection('roi')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>💰 Calculadora de Ahorro</a>
            <a onClick={() => scrollToSection('planes')} style={{ color: '#f8fafc', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>🏷️ Planes & Precios</a>
            <a onClick={() => scrollToSection('faq')} style={{ color: '#f8fafc', padding: '6px 0' }}>❓ Preguntas Frecuentes</a>
          </div>
        )}
      </nav>

      {/* ==============================================================
          2. HERO SECTION
      ============================================================== */}
      <section style={{
        padding: isMobile ? '50px 16px 40px 16px' : '90px 24px 70px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Glow Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '9999px',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '800',
          color: '#34d399',
          marginBottom: '24px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
        }}>
          <Zap size={17} />
          <span>⚡ Impulsado por Betico IA: Nuestro Motor de IA Propio y Seguro</span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(2.1rem, 6.5vw, 4.2rem)',
          fontWeight: '900',
          lineHeight: '1.12',
          letterSpacing: '-1.5px',
          margin: '0 0 20px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Tu Sitio Web Oficial, Tienda, Citas e IA en un Solo Lugar
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 2.6vw, 1.3rem)',
          color: '#94a3b8',
          maxWidth: '860px',
          margin: '0 auto 36px auto',
          lineHeight: '1.6',
          padding: '0 10px'
        }}>
          Crea tu <strong style={{ color: '#ffffff' }}>Página Web Oficial</strong> en minutos, vende en tu <strong style={{ color: '#ffffff' }}>Tienda Digital</strong>, llena tu <strong style={{ color: '#ffffff' }}>Agenda de Citas</strong> y automatiza la atención 24/7 por WhatsApp con <strong style={{ color: '#34d399' }}>Betico IA</strong> y cobros SINPE verificados con visión.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '50px' }}>
          <button
            onClick={() => {
              setSelectedPlanForRegister('pro');
              setShowRegisterModal(true);
            }}
            style={{
              padding: isMobile ? '13px 22px' : '16px 34px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: isMobile ? '0.98rem' : '1.08rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.45)'
            }}
          >
            <Zap size={20} /> Comenzar Prueba Gratis (15 Días)
          </button>
          <a
            href="https://wa.me/50688888888?text=Hola%20Betico%2C%20quiero%20ver%20la%20demostraci%C3%B3n%20en%20vivo"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: isMobile ? '13px 22px' : '16px 34px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: isMobile ? '0.98rem' : '1.08rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.45)'
            }}
          >
            <WhatsAppIcon size={20} color="white" /> Probar Demo en WhatsApp
          </a>

          <button
            onClick={onLoginClick}
            style={{
              padding: isMobile ? '13px 22px' : '16px 34px',
              backgroundColor: '#1e293b',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: isMobile ? '0.98rem' : '1.08rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Ingresar a mi Panel <ArrowRight size={18} />
          </button>
        </div>

        {/* Live Simulation Showcase Box */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: '#0f172a',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: isMobile ? '18px' : '28px',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
          textAlign: 'left',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: '#94a3b8', marginLeft: '8px', fontWeight: '700' }}>
                Demostración en Tiempo Real • WhatsApp & SINPE Visión
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.18)', color: '#34d399', padding: '3px 10px', borderRadius: '9999px', fontWeight: '800' }}>
              ⚡ 0.8s
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: isMobile ? '92%' : '78%', backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#38bdf8', fontWeight: 'bold', fontSize: '0.82rem' }}>
                <Volume2 size={16} />
                <span>Nota de Voz del Cliente (0:07)</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.85rem' }}>
                "Buenas! Quiero pedir una Hamburguesa Especial con papas y reservar cita para las 3:00pm"
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: isMobile ? '94%' : '82%', backgroundColor: '#064e3b', padding: '14px 18px', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem', color: '#ecfdf5', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: '800', color: '#6ee7b7', fontSize: '0.85rem' }}>
                <Bot size={16} /> Betico IA (Motor Propio)
              </div>
              ¡Hola! Con gusto te tomo la orden 🍔:<br />
              • 1x <strong>Hamburguesa Especial con papas</strong> (₡5.500)<br />
              • Cita programada para hoy a las <strong>3:00 PM</strong> 📅.<br />
              ¿Deseas pagar por SINPE Móvil o pasar a retirar al local?
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: isMobile ? '94%' : '82%', backgroundColor: '#042f2e', border: '1px solid #059669', padding: '14px 18px', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem', color: '#ecfdf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', color: '#a7f3d0', marginBottom: '4px', fontSize: '0.85rem' }}>
                <ShieldCheck size={18} /> ✅ Comprobante SINPE Móvil Validado con Visión
              </div>
              <div style={{ fontSize: '0.85rem' }}>Monto confirmado: <strong>₡5.500</strong> • Ref: <strong>#893012</strong></div>
              <div style={{ fontSize: '0.78rem', color: '#6ee7b7', marginTop: '4px' }}>
                ⚡ Pedido confirmado, comanda despachada a cocina y cita reservada en el calendario.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. LOS 4 GRANDES PILARES (SUPERPODERES)
      ============================================================== */}
      <section id="pilares" style={{
        padding: '80px 24px',
        backgroundColor: '#0b1120',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Plataforma Todo en Uno
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: '900', margin: '0 0 14px 0', letterSpacing: '-0.5px' }}>
              Los 4 Pilares Fundamentales de Betico
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '700px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Todo lo que tu negocio necesita para operar, vender y fidelizar clientes sin pagar múltiples herramientas separadas.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' }}>
            
            {/* Pilar 1: Creador de Sitios Web */}
            <div id="website-builder" style={{
              backgroundColor: '#111827',
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
                borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', filter: 'blur(30px)'
              }} />
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Globe size={28} color="#3b82f6" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px' }}>PILAR 1</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: 'white' }}>Creador de Sitios Web Oficiales</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Diseña la página web oficial de tu negocio (<code style={{ color: '#60a5fa' }}>betico.tech/sitio/tu-marca</code>) en minutos. Elige estilo dividido o con imagen hover, sube tu logo para fondos claros y oscuros, define colores y activa los botones directos a tienda y reservas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#3b82f6" /> Enlace web oficial listo para poner en tu biografía de Instagram o TikTok</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#3b82f6" /> Logo adaptable automático para fondos claros y footer oscuro</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#3b82f6" /> Control de visibilidad de secciones (Sobre Nosotros, Servicios, Reseñas)</div>
              </div>
            </div>

            {/* Pilar 2: Betico IA Propia */}
            <div id="betico-ia" style={{
              backgroundColor: '#111827',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
                borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', filter: 'blur(30px)'
              }} />
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Zap size={28} color="#10b981" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '6px' }}>PILAR 2</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: 'white' }}>Motor de IA Betico Propio</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                <strong>💸 Cero Tarifas Ocultas en Dólares:</strong> Sin pagos extra de $20/mes ni requerimiento de tarjetas internacionales. Contesta mensajes y notas de voz 24/7 en WhatsApp, genera descripciones para tu catálogo y atiende clientes sin límites de tokens ni cobros extras.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#10b981" /> Tus datos están seguros y no se usan para entrenar modelos de grandes empresas</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#10b981" /> Generación automática de títulos y descripciones atractivas para tu catálogo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#10b981" /> Historial y métricas de asistencias brindadas sin cobros por tokens</div>
              </div>
            </div>

            {/* Pilar 3: Tienda Digital & SINPE */}
            <div id="tienda-agenda" style={{
              backgroundColor: '#111827',
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
                borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', filter: 'blur(30px)'
              }} />
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <ShoppingBag size={28} color="#f59e0b" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px' }}>PILAR 3</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: 'white' }}>Tienda Digital & Menú Online</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Catálogo interactivo con carrito de compras, cálculo de envío express o retiro en local y pedidos directo a WhatsApp. Validación automática de capturas SINPE Móvil mediante IA con Visión Artificial.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#f59e0b" /> Verificación instantánea de comprobantes bancarios sin abrir tu banco</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#f59e0b" /> Soporte para variantes de producto (tallas, sabores, extras)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#f59e0b" /> Pantalla de Cocina (KDS) y portal de repartidores integrado</div>
              </div>
            </div>

            {/* Pilar 4: Agenda y Citas 24/7 */}
            <div style={{
              backgroundColor: '#111827',
              borderRadius: '20px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px',
                borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', filter: 'blur(30px)'
              }} />
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Calendar size={28} color="#a855f7" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px' }}>PILAR 4</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: 'white' }}>Agenda de Citas & Reservas 24/7</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Permite a tus clientes agendar citas por WhatsApp o desde tu portal web de reservas. Asignación automática por especialista o colaborador, control de horarios y recordatorios automáticos para eliminar inasistencias.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#a855f7" /> Recordatorios automáticos por WhatsApp 24h y 2h antes de la cita</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#a855f7" /> Portal exclusivo para especialistas con su propia agenda de trabajo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="#a855f7" /> Cobro de anticipos o señas mediante SINPE Móvil</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================
          4. CALCULADORA DE AHORRO (ROI)
      ============================================================== */}
      <section id="roi" style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Calcula tu Retorno de Inversión
        </div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
          ¿Cuánto Dinero y Horas Ahorrarás con Betico?
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '650px', margin: '0 auto 40px auto' }}>
          Mueve los deslizadores según el volumen de mensajes y ticket promedio de tu negocio.
        </p>

        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '20px' : '36px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          textAlign: 'left'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px', marginBottom: '36px' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.92rem', marginBottom: '10px' }}>
                <span>Mensajes recibidos al día:</span>
                <span style={{ color: '#34d399', fontWeight: '800' }}>{dailyMessages} msgs</span>
              </label>
              <input
                type="range"
                min="20"
                max="600"
                step="10"
                value={dailyMessages}
                onChange={(e) => setDailyMessages(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.92rem', marginBottom: '10px' }}>
                <span>Ticket promedio de venta:</span>
                <span style={{ color: '#34d399', fontWeight: '800' }}>₡{avgTicket.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="2000"
                max="40000"
                step="500"
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>TIEMPO DE ATENCIÓN AHORRADO</div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#34d399' }}>{hoursSavedPerMonth} Horas<span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}> / mes</span></div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '6px' }}>Equivalente a más de 1 jornada laboral completa recuperada.</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>VENTAS ESTIMADAS RECUPERADAS</div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#60a5fa' }}>₡{estimatedRecoveredSales.toLocaleString()}<span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}> / mes</span></div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '6px' }}>Por respuestas inmediatas en menos de 2 segundos en horario nocturno y festivo.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          5. PLANES & PRECIOS (2 PLANES OFICIALES)
      ============================================================== */}
      <section id="planes" style={{
        padding: '80px 24px',
        backgroundColor: '#0b1120',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Precios Transparentes en Colones
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: '900', margin: '0 0 14px 0', letterSpacing: '-0.5px' }}>
            Planes Todo Incluido con 15 Días de Prueba Gratis
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '700px', margin: '0 auto 50px auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Comienza a operar hoy mismo sin tarjeta de crédito. Paga en colones por SINPE Móvil o transferencia. Sin cobros sorpresa en dólares.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px', alignItems: 'stretch' }}>
            
            {/* Plan Betico Pro (Destacado) */}
            <div style={{
              backgroundColor: '#111827',
              padding: '38px 30px',
              borderRadius: '24px',
              border: '2px solid #10b981',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              position: 'relative',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.22)'
            }}>
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: '900',
                padding: '4px 16px', borderRadius: '9999px', letterSpacing: '0.06em'
              }}>
                15 DÍAS DE PRUEBA GRATIS
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 4px 0', color: 'white' }}>Plan Betico Pro</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>Para todo comercio que busca vender y agendar en automático.</p>
                </div>
              </div>

              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#34d399', margin: '16px 0' }}>
                ₡55.000 <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 'normal' }}>/ mes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '32px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>1 Número de WhatsApp Conectado</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Motor Betico IA Propio</strong> (Respuestas ilimitadas, cero cobro por tokens)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Comprensión de Notas de Voz</strong> de WhatsApp</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Creador de Sitios Web Oficial</strong> (betico.tech/sitio/tu-marca)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Tienda Online & Menú</strong> con pedidos a WhatsApp</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Agenda de Citas & Reservas 24/7</strong> con recordatorios</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Verificación SINPE Móvil con Visión Artificial</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Portal de Repartidores & Asignación por GPS</strong> (1 Local)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#10b981" /> <strong>Pantalla de Cocina (KDS) & Difusión Masiva CRM</strong></div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlanForRegister('pro');
                  setShowRegisterModal(true);
                }}
                style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Zap size={18} /> Comenzar Prueba Gratis (15 Días)
              </button>
            </div>

            {/* Plan Betico Empresa */}
            <div style={{
              backgroundColor: '#111827',
              padding: '38px 30px',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 4px 0', color: 'white' }}>Plan Betico Empresa</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>Para franquicias, cadenas y negocios con múltiples sucursales.</p>
                </div>
              </div>

              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: 'white', margin: '16px 0' }}>
                ₡85.000 <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 'normal' }}>/ mes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '32px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Todo lo incluido en Plan Betico Pro</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Múltiples Sucursales o Sedes</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Enrutamiento Inteligente de Pedidos por GPS</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Pantallas KDS y Repartidores Independientes por Sede</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Cuentas SINPE y Bancos Separados por Local</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Acceso para Múltiples Administradores y Roles</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={17} color="#3b82f6" /> <strong>Soporte Prioritario VIP 24/7 por WhatsApp</strong></div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlanForRegister('enterprise');
                  setShowRegisterModal(true);
                }}
                style={{
                  padding: '15px',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Probar Plan Empresa Gratis <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================
          6. PREGUNTAS FRECUENTES (FAQ)
      ============================================================== */}
      <section id="faq" style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Despeja tus Dudas
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
            Preguntas Frecuentes
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={20} color="#10b981" /> : <ChevronDown size={20} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px 22px', color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          7. FOOTER ELEGANTE (100% SVG OFICIALES)
      ============================================================== */}
      <footer style={{
        backgroundColor: '#050914',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '60px 24px 30px 24px',
        color: '#94a3b8',
        fontSize: '0.88rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1.5fr', gap: '40px', marginBottom: '50px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={20} color="white" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                Betico<span style={{ color: '#10b981' }}>.tech</span>
              </span>
            </div>
            <p style={{ lineHeight: '1.6', margin: '0 0 20px 0', maxWidth: '320px' }}>
              La plataforma SaaS costarricense que une tu sitio web oficial, tienda digital, agenda de citas y motor de IA en WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://wa.me/50688888888" target="_blank" rel="noreferrer" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                <WhatsAppIcon size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                <FacebookIcon size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                <InstagramIcon size={18} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                <TikTokIcon size={18} />
              </a>
            </div>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '800', marginBottom: '16px' }}>4 Superpoderes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a onClick={() => scrollToSection('website-builder')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web Oficial</a>
              <a onClick={() => scrollToSection('betico-ia')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Motor Betico IA</a>
              <a onClick={() => scrollToSection('tienda-agenda')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Tienda Digital</a>
              <a onClick={() => scrollToSection('tienda-agenda')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Agenda de Citas</a>
            </div>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '800', marginBottom: '16px' }}>Legal & Soporte</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="/politica-de-privacidad" style={{ color: '#94a3b8', textDecoration: 'none' }}>Política de Privacidad</a>
              <a href="/terminos-y-condiciones" style={{ color: '#94a3b8', textDecoration: 'none' }}>Términos de Servicio</a>
              <a href="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Acceso al Panel</a>
              <a onClick={() => scrollToSection('faq')} style={{ color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>Preguntas Frecuentes</a>
            </div>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '800', marginBottom: '16px' }}>Atención & Contacto</div>
            <p style={{ lineHeight: '1.6', margin: '0 0 14px 0' }}>
              San José, Costa Rica 🇨🇷<br />
              Soporte técnico directo vía WhatsApp y correo electrónico.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.8rem', fontWeight: 'bold' }}>
              <CheckCircle size={14} /> Sistema 100% Operativo
            </div>
          </div>

        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>© {new Date().getFullYear()} Betico.tech. Todos los derechos reservados.</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Desarrollado con orgullo en Costa Rica ⚡</div>
        </div>
      </footer>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        initialPlan={selectedPlanForRegister}
      />
    </div>
  );
}
