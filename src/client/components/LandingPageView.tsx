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
  DollarSign,
  Award,
  Gift,
  Scissors,
  Coffee,
  Trophy,
  AlertTriangle,
  XCircle,
  Server,
  FileCode
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

  // Industry Vertical Tab State
  const [activeVertical, setActiveVertical] = useState<'restaurantes' | 'servicios' | 'canchas' | 'retail' | 'fidelidad'>('restaurantes');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedPlanForRegister, setSelectedPlanForRegister] = useState<'pro' | 'enterprise'>('pro');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Betico | Presencia Digital Estratégica, Tienda, Citas y WhatsApp en Costa Rica';
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

  // Industry Verticals Data
  const verticalData = {
    restaurantes: {
      badge: 'Modo Restaurante y Comidas',
      title: 'Restaurantes, Pizzerías, Cafeterías y Sodas',
      subtitle: 'Digitaliza tus pedidos desde la mesa, para llevar o a domicilio sin pagar comisiones abusivas.',
      features: [
        {
          title: 'Pantalla de Cocina (KDS) en Tiempo Real',
          desc: 'Los pedidos de WhatsApp y de tu tienda web aparecen al instante en una pantalla táctil en cocina organizados por orden de llegada y estado (Recibido, En Cocina, Listo).'
        },
        {
          title: 'Menú QR para Comer en Mesa o Llevar',
          desc: 'Tus comensales escanean el código QR en su mesa, seleccionan sus platillos con acompañamientos y pagan al instante por SINPE Móvil o tarjeta bancaria.'
        },
        {
          title: 'Flota Propia de Delivery con GPS',
          desc: 'Asigna pedidos a tus repartidores en su propio portal móvil, con cálculo automático del costo de entrega por kilómetro usando Google Maps.'
        }
      ],
      impact: 'Atiende hasta un 40% más de comandas en horas pico y ahorra hasta ₡350.000 al mes en comisiones de plataformas de entrega.',
      ctaText: 'Probar Betico para Restaurantes'
    },
    servicios: {
      badge: 'Agenda y Servicios 24/7',
      title: 'Salones de Belleza, Barberías, Spas y Clínicas',
      subtitle: 'Llena tu agenda en automático mientras atiendes a tus clientes, sin secretarias saturadas.',
      features: [
        {
          title: 'Asistente de Citas 24/7 en WhatsApp',
          desc: 'Tu bot de IA atiende a cualquier hora, consulta la disponibilidad en tiempo real según el servicio solicitado y confirma la cita en segundos.'
        },
        {
          title: 'Portal Privado para Especialistas',
          desc: 'Cada barbero, estilista o terapeuta accede desde su propio celular con su usuario para revisar únicamente su agenda y clientes del día.'
        },
        {
          title: 'Recordatorios Automáticos 24h y 2h Antes',
          desc: 'Betico envía recordatorios directos por WhatsApp con botón de confirmación o reprogramación, reduciendo las sillas vacías al mínimo.'
        }
      ],
      impact: 'Reduce las citas olvidadas a 0% y asegura tus ingresos cobrando señas o anticipos por SINPE Móvil o tarjeta al agendar.',
      ctaText: 'Probar Betico para Citas y Salones'
    },
    canchas: {
      badge: 'Canchas y Complejos Deportivos',
      title: 'Complejos de Pádel, Fútbol 5, Tenis y Deportes',
      subtitle: 'Administra tus canchas por horas, automatiza el cobro de señas y llena los horarios nocturnos.',
      features: [
        {
          title: 'Reservas por Bloque Horario en Vivo',
          desc: 'Tus clientes eligen cancha, fecha y hora disponible desde una grilla interactiva en tu sitio web o directamente conversando con tu bot de WhatsApp.'
        },
        {
          title: 'Tarifas Diferenciadas de Día y Noche',
          desc: 'Configura precios automáticos según el horario (tarifa regular diurna o tarifa nocturna con iluminación de canchas incluida).'
        },
        {
          title: 'Cobro de Seña Inmediata con SINPE o Tarjeta',
          desc: 'El espacio solo queda reservado cuando el cliente transfiere por SINPE Móvil o paga con tarjeta, protegiendo tu cancha contra cancelaciones.'
        }
      ],
      impact: 'Elimina las reservas duplicadas por llamadas telefónicas y maximiza la ocupación de tus canchas en horarios estelares.',
      ctaText: 'Probar Betico para Canchas Deportivas'
    },
    retail: {
      badge: 'Tienda Digital y Retail',
      title: 'Tiendas de Ropa, Boutiques, Calzado y Accesorios',
      subtitle: 'Convierte tus redes sociales en ventas reales con un catálogo que cobra y despacha solo.',
      features: [
        {
          title: 'Catálogo con Variantes Completas',
          desc: 'Muestra tus productos con opciones de talla, color y modelo, con fotos automáticas enviadas al WhatsApp cuando un cliente consulta.'
        },
        {
          title: 'Integración con Correos de Costa Rica',
          desc: 'Cálculo automatizado de costos de envío para el Gran Área Metropolitana (GAM) y Resto del País, más opción de mensajería express.'
        },
        {
          title: 'Control de Stock en Tiempo Real',
          desc: 'Cada compra descuenta el inventario al instante en la tienda web y en WhatsApp, evitando ventas de productos sin existencia.'
        }
      ],
      impact: 'Aumenta tus ventas por WhatsApp hasta un 35% ofreciendo cobro directo con tarjeta y verificación automática de SINPE.',
      ctaText: 'Probar Betico para Tiendas y Boutiques'
    },
    fidelidad: {
      badge: 'Retención y Fidelización Universal',
      title: 'Club de Clientes, Tarjetas de Sellos y Puntos',
      subtitle: 'Multiplica la recompra de tu negocio con una billetera digital moderna accesible por cédula.',
      features: [
        {
          title: 'Tarjetas de Sellos Digitales en el Móvil',
          desc: 'Dile adiós a las tarjetas de cartón que se pierden o se dañan. Premia a tus clientes al acumular sellos (ej. 8 cafés o 10 cortes y el siguiente es gratis).'
        },
        {
          title: 'Acumulación de Puntos por Compras',
          desc: 'Define un porcentaje de cashback en puntos por cada colón comprado, canjeable como dinero en futuras compras o cupones de descuento.'
        },
        {
          title: 'Billetera Digital Universal por Cédula',
          desc: 'Tus clientes entran a betico.tech/fidelidad con su cédula para ver todas sus tarjetas y cupones de tus comercios, o consultan su saldo con el bot.'
        }
      ],
      impact: 'Los negocios con programa de lealtad activo reportan hasta un 45% más de frecuencia de compra y mayor ticket promedio.',
      ctaText: 'Activar Club de Fidelización'
    }
  };

  const faqs = [
    {
      q: '¿Por qué elegir Betico en lugar de contratar hosting, diseñador y bots por separado?',
      a: 'Si intentas armar tu infraestructura digital por separado necesitas pagar hosting web mensual ($15 - $30/mes), pagar un diseñador web ($300 - $800), pagar un servidor cloud para mantener el bot activo ($20 - $50/mes), pagar consumos de tokens de IA en dólares y lidiar con programadores para integrar pasarelas de pago y calendarios. Betico te da toda tu presencia digital estratégica unificada en 15 minutos por una sola tarifa plana en colones.'
    },
    {
      q: '¿Cómo funciona el nuevo Creador de Sitios Web de Betico?',
      a: 'Cada negocio tiene su propio creador visual en el panel donde puede personalizar la portada, colores corporativos, tipografía, logo blanco/oscuro y activar las secciones que necesite. Al guardar, se genera instantáneamente tu enlace web oficial (ej. betico.tech/sitio/tu-negocio) con tu tienda y botón de reservas incluidos.'
    },
    {
      q: '¿Cómo ayuda Betico a restaurantes, sodas y cafeterías?',
      a: 'Incluye Modo Restaurante con menú digital para comer en el local con número de mesa o para llevar, Pantalla de Cocina (KDS) en tiempo real para no usar comandas de papel, y portal para tus propios repartidores con cálculo de envío por kilómetro mediante Google Maps.'
    },
    {
      q: '¿Puedo administrar canchas de fútbol 5, pádel o tenis?',
      a: 'Sí. Betico cuenta con un módulo específico para complejos deportivos donde tus clientes reservan canchas por horas en vivo, con tarifas diferenciadas de día y de noche (con iluminación), confirmación inmediata y cobro de señas por SINPE o tarjeta.'
    },
    {
      q: '¿Cómo funciona el nuevo Club de Fidelización y las tarjetas de sellos?',
      a: 'Reemplaza las tarjetas de cartón que los clientes siempre pierden. Puedes crear tarjetas por sellos digitales (ej. "el 8° corte o café es gratis") o monederos de puntos por compras. Tus clientes consultan sus sellos y puntos en su billetera digital en betico.tech/fidelidad ingresando su número de cédula, o preguntándole al bot de WhatsApp.'
    },
    {
      q: '¿Cómo funciona la conexión con mi modelo de IA favorito (Gemini, OpenAI o Claude)?',
      a: 'Conectas tu clave de API de Google Gemini, OpenAI o Anthropic Claude en segundos desde tu panel. Betico aplica una arquitectura de prompts altamente eficiente que optimiza al máximo cada token consumido, logrando respuestas comerciales rápidas, precisas y con una gran utilidad sin desperdiciar presupuesto.'
    },
    {
      q: '¿Necesito cambiar mi número de WhatsApp actual?',
      a: 'No. Puedes conectar el mismo número comercial que ya tienes activo mediante código QR en menos de 2 minutos. Tus contactos, chats existentes y fotos de perfil se mantienen intactos.'
    },
    {
      q: '¿Cómo funciona la verificación de SINPE Móvil?',
      a: 'En Betico puedes ofrecer dos modalidades según prefieras: SINPE Automático, donde la pasarela verifica la transacción de forma inmediata directamente con el banco y confirma el pedido o cita en segundos; o SINPE Manual, donde tu cliente transfiere a tu número habitual y recibes el comprobante en tu panel para confirmarlo tú mismo con un clic.'
    },
    {
      q: '¿Cómo funciona el cobro con Tarjetas de Crédito y Débito en Betico?',
      a: 'Tus clientes pueden pagar con Visa, Mastercard y AMEX de manera fácil y rápida al comprar en tu tienda web, agendar una cita o reservar una cancha. La verificación es inmediata y el dinero de tus ventas se liquida directamente en tu cuenta bancaria nacional.'
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
          1. HEADER Y BARRA DE NAVEGACIÓN
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
            <nav style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.86rem', fontWeight: '600', color: '#475569' }}>
              <a onClick={() => scrollToSection('superpoderes')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>5 Superpoderes</a>
              <a onClick={() => scrollToSection('giros-negocio')} style={{ color: '#0b3c3d', textDecoration: 'none', cursor: 'pointer', fontWeight: '700' }}>Giros de Negocio</a>
              <a onClick={() => scrollToSection('comparativa')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Comparativa</a>
              <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#b51c12', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e0352b' }} />
                Pagos Tarjeta
              </a>
              <a onClick={() => scrollToSection('sitio-web')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web</a>
              <a onClick={() => scrollToSection('motor-ia')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Tu Modelo IA</a>
              <a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Tienda y Citas</a>
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
                  boxShadow: '0 4px 14px rgba(11, 60, 61, 0.22)',
                  transition: 'all 0.2s'
                }}
              >
                <span>Ir al Panel</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
            <a onClick={() => scrollToSection('superpoderes')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>⚡ 5 Superpoderes de Betico</a>
            <a onClick={() => scrollToSection('giros-negocio')} style={{ color: '#0b3c3d', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>🎯 Giros de Negocio</a>
            <a onClick={() => scrollToSection('comparativa')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>⚖️ Comparativa Estratégica</a>
            <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#b51c12', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>💳 Pagos Tarjeta (Tilopay 3D Secure)</a>
            <a onClick={() => scrollToSection('sitio-web')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🌐 Creador de Sitios Web</a>
            <a onClick={() => scrollToSection('motor-ia')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🤖 Tu Modelo IA Favorito</a>
            <a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🛍️ Tienda y Agenda de Citas</a>
            <a onClick={() => scrollToSection('calculadora-roi')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>💰 Calculadora de Ahorro</a>
            <a onClick={() => scrollToSection('precios')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🏷️ Planes y Precios</a>
            <a onClick={onLoginClick} style={{ color: '#0b3c3d', padding: '8px 0', fontWeight: 'bold' }}>🔑 Iniciar Sesión</a>
          </div>
        )}
      </header>

      {/* ==============================================================
          2. CONTENIDO PRINCIPAL
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
              <span>⚡ Nuevo: Pagos con Tarjeta + Verificación de SINPE Móvil + Tu Modelo IA Favorito + Club de Fidelidad</span>
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
              La Presencia Digital Estratégica que{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0b3c3d 0%, #134b4c 45%, #b51c12 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Todo Emprendimiento Necesita
              </span>
            </h1>

            {/* Hero Description */}
            <p style={{
              fontSize: 'clamp(1rem, 2.3vw, 1.25rem)',
              color: '#475569',
              lineHeight: 1.65,
              maxWidth: '860px',
              margin: '0 auto 36px auto',
              fontWeight: 400
            }}>
              Crea tu <strong>Página Web Oficial</strong> en minutos, vende en tu <strong>Tienda Digital</strong> con cobros por <strong>Tarjeta (Visa, Mastercard, AMEX)</strong> y <strong>SINPE Móvil</strong>, llena tu <strong>Agenda de Citas o Canchas Deportivas</strong>, fideliza clientes con <strong>Sellos y Puntos Digitales</strong> y automatiza la atención 24/7 por WhatsApp potenciada por <strong>tu modelo de IA favorito</strong>.
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
                    Demostración en Tiempo Real • WhatsApp y Pagos Verificados
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
                    <span>Betico IA • Potenciado con tu modelo de IA favorito</span>
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
                    ¿Deseas pagar por <strong>SINPE Móvil</strong> o <strong>Tarjeta de Crédito o Débito</strong>?
                  </p>
                </div>

                {/* Side-by-Side Dual Payment Validations */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', paddingTop: '6px' }}>
                  
                  {/* SINPE Payment Validation */}
                  <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '2px solid rgba(11,60,61,0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <QrCode size={20} />
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>SINPE Móvil Verificado</span>
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

                  {/* Card Payment Validation */}
                  <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '2px solid rgba(240,67,55,0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fff1f0', color: '#b51c12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CreditCard size={20} />
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Tarjeta de Débito o Crédito</span>
                        <ShieldCheck size={14} color="#b51c12" />
                      </div>
                      <div style={{ color: '#64748b', marginTop: '2px', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                        Monto: <strong style={{ color: '#0f172a' }}>₡5.500</strong> • Aut: BAC-948210
                      </div>
                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: '#b51c12', backgroundColor: '#fff1f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', border: '1px solid #ffc7c4' }}>
                        ✓ Pago verificado al instante
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
              <span>Pagos con Tarjeta y SINPE Verificados</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#0b3c3d" />
              <span>Depósito Directo a tu Cuenta Bancaria</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#b51c12" />
              <span>Máximo ahorro de tokens con tu IA favorita</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#0b3c3d" />
              <span>Cobra en Tienda, Citas y Canchas</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            NUEVA SECCIÓN: COMPARATIVA ESTRATÉGICA
        ------------------------------------------------------------ */}
        <section id="comparativa" style={{
          padding: isMobile ? '60px 16px' : '90px 24px',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 48px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#b51c12',
                backgroundColor: '#fff1f0',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid #ffc7c4',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                Presencia Digital Estratégica
              </span>
              <h2 style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.2
              }}>
                La Integración que Todo Emprendimiento Necesita para Operar en Digital
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Si intentas armar esta solución por tu cuenta necesitarías múltiples servicios en dólares, desarrolladores y semanas de ajustes técnicos. Compara el camino tradicional frente a la solución integrada de Betico:
              </p>
            </div>

            {/* Comparison Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '28px',
              alignItems: 'stretch'
            }}>
              
              {/* Card 1: Camino Tradicional */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '36px',
                border: '1px solid #fecaca',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #fee2e2',
                    marginBottom: '16px'
                  }}>
                    <XCircle size={14} />
                    <span>El Camino Tradicional (Fraccionado y Costoso)</span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#991b1b', margin: '0 0 8px 0' }}>
                    5 o Más Servicios Separados
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '22px' }}>
                    Contratar herramientas aisladas genera cobros sorpresa en dólares, problemas de sincronización y dependencia técnica constante.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Hosting Web y Dominio:</strong>
                        <span style={{ color: '#64748b' }}> Pago mensual recurrente de $15 a $30 USD solo por mantener una página web encendida.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Diseñador o Creador Web:</strong>
                        <span style={{ color: '#64748b' }}> Inversión inicial de $300 a $800 USD, más cobros por cada cambio de fotos o precios.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Servidor Cloud (VPS) para el Bot:</strong>
                        <span style={{ color: '#64748b' }}> Alquilar un servidor en la nube ($20 a $50 USD/mes) y configurarlo para que el bot no se apague.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Construir y Programar el Bot de IA:</strong>
                        <span style={{ color: '#64748b' }}> Desarrollar los flujos, conectar APIs complejas y pagar consumo de tokens en dólares cada mes.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Ajustar Todo para que Funcione:</strong>
                        <span style={{ color: '#64748b' }}> Semanas de dolores de cabeza intentando que el bot sepa el stock de la tienda y la agenda de citas.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{
                  marginTop: '26px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fed7d7',
                  fontSize: '0.82rem',
                  color: '#991b1b',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Costo estimado: Más de $150 USD/mes + $500 USD de desarrollo inicial y semanas de configuración.
                </div>
              </div>

              {/* Card 2: La Solución Integrada Betico */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '36px',
                border: '2px solid #0b3c3d',
                boxShadow: '0 12px 36px rgba(11, 60, 61, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-13px',
                  right: '28px',
                  backgroundColor: '#0b3c3d',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 2px 8px rgba(11, 60, 61, 0.25)'
                }}>
                  Solución Estratégica Todo en Uno
                </div>

                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#eff7f7',
                    color: '#0b3c3d',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #b0dcdc',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={14} color="#0b3c3d" />
                    <span>Con Betico (Unificado, Simple y en Colones)</span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0b3c3d', margin: '0 0 8px 0' }}>
                    Toda tu Infraestructura en una Sola Plataforma
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '22px' }}>
                    Obtén toda tu presencia digital lista para operar en 15 minutos, sin programadores, sin hosting externo y con tarifa fija en colones.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Sitio Web Oficial en Minutos:</strong>
                        <span style={{ color: '#475569' }}> Tu dirección propia (betico.tech/sitio/tu-marca) con hosting de alta velocidad y certificado SSL incluido.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Potencia tu Modelo de IA Favorito:</strong>
                        <span style={{ color: '#475569' }}> Conecta tu clave de API de Gemini, OpenAI o Claude en segundos. Prompts optimizados para sacarle la máxima utilidad a tus tokens con el menor costo operativo.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Tienda, Citas y Canchas Conectadas:</strong>
                        <span style={{ color: '#475569' }}> Todo integrado por defecto: si un cliente compra o agenda, el inventario y el calendario se sincronizan en 0s.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Pasarelas de Pago Nativas:</strong>
                        <span style={{ color: '#475569' }}> Acepta tarjetas Visa, Mastercard y AMEX con verificación directa y depósito en tu cuenta bancaria nacional.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Club de Fidelidad y Sellos Digitales:</strong>
                        <span style={{ color: '#475569' }}> Monedero digital por cédula (betico.tech/fidelidad) para que tus clientes acumulen sellos y puntos recurrentes.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{
                  marginTop: '26px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#eff7f7',
                  border: '1px solid #b0dcdc',
                  fontSize: '0.85rem',
                  color: '#0b3c3d',
                  fontWeight: '700',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Zap size={16} />
                  <span>Tarifa plana en colones: ₡55.000/mes • Sin comisiones • Listo en 15 minutos 🇨🇷</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            NUEVA SECCIÓN: SELECTOR POR GIRO DE NEGOCIO
        ------------------------------------------------------------ */}
        <section id="giros-negocio" style={{
          padding: isMobile ? '60px 16px' : '90px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#0b3c3d',
                backgroundColor: '#eff7f7',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid #b0dcdc',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                Especializado por Industria
              </span>
              <h2 style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.2
              }}>
                Diseñado a la Medida de tu Giro de Negocio
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Cada negocio tiene dinámicas operativas diferentes. Elige tu giro de negocio y conoce cómo Betico se adapta a tu día a día:
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '16px',
              marginBottom: '32px',
              scrollbarWidth: 'none'
            }}>
              {[
                { id: 'restaurantes', label: 'Restaurantes y Cafeterías', icon: Utensils },
                { id: 'servicios', label: 'Salones y Barberías', icon: Scissors },
                { id: 'canchas', label: 'Canchas Deportivas y Pádel', icon: Trophy },
                { id: 'retail', label: 'Tiendas y Boutiques', icon: ShoppingBag },
                { id: 'fidelidad', label: 'Club de Fidelización', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeVertical === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveVertical(tab.id as any)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      border: isActive ? '2px solid #0b3c3d' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#0b3c3d' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 4px 14px rgba(11, 60, 61, 0.2)' : 'none',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={18} color={isActive ? '#ffffff' : '#0b3c3d'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Industry Showcase Card */}
            {(() => {
              const current = verticalData[activeVertical];
              return (
                <div style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: '24px',
                  padding: isMobile ? '24px' : '40px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', display: 'block', marginBottom: '4px' }}>
                        {current.badge}
                      </span>
                      <h3 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                        {current.title}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                        {current.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlanForRegister('pro');
                        setShowRegisterModal(true);
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#0b3c3d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(11, 60, 61, 0.2)'
                      }}
                    >
                      <Zap size={16} />
                      <span>{current.ctaText}</span>
                    </button>
                  </div>

                  {/* 3 Key Features */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                    {current.features.map((feat, idx) => (
                      <div key={idx} style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <CheckCircle2 size={18} color="#0b3c3d" />
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {feat.title}
                          </h4>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
                          {feat.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Impact Bar */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid #b0dcdc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#0b3c3d',
                    fontSize: '0.88rem'
                  }}>
                    <Sparkles size={20} color="#b51c12" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: '#0f172a' }}>Impacto Comprobado: </strong>
                      <span>{current.impact}</span>
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </section>

        {/* ------------------------------------------------------------
            3. LOS 5 PILARES FUNDAMENTALES (SUPERPODERES)
        ------------------------------------------------------------ */}
        <section id="superpoderes" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 60px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', backgroundColor: '#fff1f0', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #ffc7c4', display: 'inline-block', marginBottom: '12px' }}>
                Plataforma Todo en Uno
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
                Los 5 Pilares Fundamentales de Betico
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

              {/* Pilar 2: Potencia tu Modelo de IA Favorito */}
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
                    Potencia tu Modelo de IA Favorito
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    <strong>Máximo Rendimiento de Tokens:</strong> Conecta tu clave de API de <strong>Google Gemini, OpenAI o Claude</strong>. Betico estructura la información con ingeniería de prompts optimizada para consumir la menor cantidad de tokens posible, dándote una utilidad comercial extraordinaria al menor costo operativo.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Conexión directa con Google Gemini, OpenAI (ChatGPT) y Anthropic Claude.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Prompts ultracompactos que maximizan la utilidad de cada token y evitan gastos innecesarios.</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Entiende notas de voz de WhatsApp y modismos costarricenses de forma natural.</span>
                    </li>
                  </ul>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Gemini • OpenAI • Claude</span>
                  <span style={{ color: '#b51c12', fontWeight: '700' }}>Tokens Optimizados</span>
                </div>
              </div>

              {/* Pilar 3: Tienda Digital y Pasarela Multicanal */}
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
                    Tienda Digital y Pasarela Multicanal
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Catálogo interactivo con carrito de compras, cobro en línea con <strong>Tarjetas de Crédito y Débito</strong> (Visa, Mastercard, AMEX), verificación de <strong>SINPE Móvil</strong> (automático o manual) y gestión de envíos express por GPS.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Acepta pagos con Tarjetas de Crédito y Débito (Visa, Mastercard, AMEX).</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>Verificación de SINPE Móvil: automática con confirmación bancaria o manual desde tu panel.</span>
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

              {/* Pilar 4: Agenda de Citas y Reservas 24/7 */}
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
                    Agenda de Citas y Reservas 24/7
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Permite a tus clientes agendar citas por WhatsApp o desde tu portal web de reservas, con opción de cobro en línea con tarjeta o SINPE. Asignación automática por especialista o colaborador, control de horarios y recordatorios automáticos para eliminar inasistencias.
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

              {/* Pilar 5 (NUEVO): Club de Fidelización y Sellos Digitales */}
              <div id="club-fidelidad" style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: isMobile ? '24px' : '32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gridColumn: isMobile ? 'auto' : 'span 2'
              }}>
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fff1f0', color: '#b51c12', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Award size={26} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#b51c12', marginBottom: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b51c12' }} />
                    Pilar 5
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                    Club de Fidelización y Tarjetas de Sellos Digitales
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Sustituye para siempre las tarjetas de cartón de sellos que tus clientes pierden en la billetera. Crea programas de sellos digitales (ej. décimo café o corte gratis), monederos de puntos por cada compra y cupones de descuento interactivos con código QR.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>Tarjetas de Sellos Móviles</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gamifica la fidelidad: tus clientes acumulan sellos por cada consumo y desbloquean premios automáticos.</span>
                    </div>
                    <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>Monedero de Puntos en Colones</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Retorna un porcentaje de cashback en puntos que tus clientes pueden usar como dinero en sus próximas compras.</span>
                    </div>
                    <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>Billetera Digital en betico.tech/fidelidad</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>El cliente ingresa con su número de cédula y consulta al instante todas sus tarjetas, puntos y cupones QR.</span>
                    </div>
                  </div>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Consulta directa por WhatsApp o Billetera Web</span>
                  <span style={{ color: '#b51c12', fontWeight: '700' }}>+45% Recompra Garantizada</span>
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
              
              {/* Text y Features */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#fff1f0', color: '#b51c12', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid #ffc7c4', marginBottom: '16px' }}>
                  <ShieldCheck size={16} />
                  <span>Nuevo Superpoder • Pasarela de Tarjetas Tilopay</span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: '900', color: '#0f172a', lineHeight: 1.18, letterSpacing: '-0.5px', margin: '0 0 18px 0' }}>
                  Acepta <span style={{ color: '#0b3c3d' }}>Tarjetas de Crédito y Débito</span> con Respaldo Bancario 3D Secure
                </h2>

                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.65, marginBottom: '24px' }}>
                  Multiplica tus ventas permitiendo que tus clientes paguen en segundos con tarjeta o SINPE Móvil. Integración directa y segura para recibir tus ingresos en tu propia cuenta bancaria en colones o dólares, con verificación automática e inmediata.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <ShieldCheck size={18} color="#0b3c3d" />
                      <span>Pagos Seguros y Verificados</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Confirmación directa con el banco del cliente en segundos. Máxima tranquilidad para ti y para tu cliente.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Zap size={18} color="#0b3c3d" />
                      <span>Verificación Inmediata</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      El pago se aprueba al instante, el pedido pasa directo a preparación y tu cliente recibe la confirmación por WhatsApp.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Building2 size={18} color="#b51c12" />
                      <span>Directo a tu Cuenta</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Sin intermediarios reteniendo tu dinero. Las ventas en colones o dólares se depositan en tu propia cuenta bancaria.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Store size={18} color="#0b3c3d" />
                      <span>Todos los Métodos de Pago</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Tarjetas bancarias, SINPE Móvil (automático o con comprobante), transferencias y pago contra entrega.
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
                      <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Pasarela Segura Integrada</span>
                    </div>
                    <span style={{ backgroundColor: '#0b3c3d', color: '#b0dcdc', padding: '3px 10px', borderRadius: '9999px', fontFamily: 'monospace', fontSize: '0.72rem', border: '1px solid rgba(176,220,220,0.3)' }}>
                      Verificación Oficial
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
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Potencia tu IA Favorita</strong> (Gemini, OpenAI, Claude con prompts optimizados para máximo ahorro de tokens)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Comprensión de Notas de Voz</strong> de WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Creador de Sitios Web Oficial</strong> (<span style={{ color: '#0b3c3d', fontFamily: 'monospace' }}>betico.tech/sitio/tu-marca</span>)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Tienda Online y Menú</strong> con pedidos a WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Pagos con Tarjeta Débito y Crédito</strong> (Visa, Mastercard, AMEX)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Agenda de Citas y Reservas 24/7</strong> con cobro en línea opcional</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Club de Fidelización y Sellos</strong> (Billetera web en betico.tech/fidelidad)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Verificación de SINPE Móvil</strong> (Automática y Manual)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Modo Restaurante con Pantalla de Cocina (KDS) y Delivery por GPS</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Módulo de Canchas Deportivas con Tarifas de Día y Noche</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Portal para Especialistas, Colaboradores y Repartidores</span></li>
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
            8. PRE-FOOTER LLAMADA A LA ACCIÓN
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
            
            {/* Logo y Resumen (Máximo Protagonismo) */}
            <div>
              <div style={{ marginBottom: '18px' }}>
                <img src="/logo.png" alt="Betico" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, maxWidth: '300px', margin: '0 0 16px 0' }}>
                La plataforma SaaS costarricense que une tu sitio web oficial, tienda digital, agenda de citas, canchas, fidelización e inteligencia artificial en WhatsApp.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #b0dcdc' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0b3c3d' }} />
                <span>Sistema 100% Operativo</span>
              </div>
            </div>

            {/* 5 Superpoderes */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                5 Superpoderes
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <li><a onClick={() => scrollToSection('sitio-web')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web Oficial</a></li>
                <li><a onClick={() => scrollToSection('motor-ia')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tu Modelo IA Favorito</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tienda Digital y Pagos</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Agenda de Citas y Reservas</a></li>
                <li><a onClick={() => scrollToSection('club-fidelidad')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Club de Fidelidad y Sellos</a></li>
                <li><a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tarjetas y SINPE Móvil</a></li>
              </ul>
            </div>

            {/* Legal y Soporte */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                Legal y Soporte
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
                Atención y Contacto
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
