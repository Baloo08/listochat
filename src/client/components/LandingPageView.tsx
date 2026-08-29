import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPageView({ onLoginClick }: LandingPageProps) {
  const [dailyMessages, setDailyMessages] = useState<number>(120);
  const [avgTicket, setAvgTicket] = useState<number>(8500);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const hoursSavedPerMonth = Math.round((dailyMessages * 2.5 * 30) / 60);
  const estimatedRecoveredSales = Math.round(dailyMessages * 0.08 * avgTicket * 30);

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
      q: '¿El asistente entiende notas de voz y modismos ticos?',
      a: 'Sí. Betico está entrenado con IA multimodal avanzada (Gemini) y reconoce notas de voz (.ogg, .opus, .mp3), audios rápidos y expresiones comunes de Costa Rica ("pura vida", "mae", "a nombre de", "sinpe", etc.).'
    },
    {
      q: '¿Puedo gestionar varias sucursales o franquicias?',
      a: 'Totalmente. Betico incluye un módulo multi-sucursal completo con cálculo de entrega por GPS a la sede más cercana, pantallas de cocina (KDS) independientes por local y números SINPE separados por sede.'
    },
    {
      q: '¿Mis datos y los de mis clientes están protegidos?',
      a: 'Absolutamente. Todas las claves de API y números están cifrados con AES-256-GCM. El sistema cumple rigurosamente con la Ley N° 8968 de Protección de Datos de Costa Rica y se hospeda de forma privada.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      
      {/* 1. NAVIGATION BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <Bot size={24} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>
                Betico<span style={{ color: '#10b981' }}>.tech</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '0.9rem', fontWeight: '600' }}>
            <a href="#caracteristicas" style={{ color: '#94a3b8', textDecoration: 'none' }}>Características</a>
            <a href="#modulos" style={{ color: '#94a3b8', textDecoration: 'none' }}>Módulos</a>
            <a href="#roi" style={{ color: '#94a3b8', textDecoration: 'none' }}>Calculadora ROI</a>
            <a href="#planes" style={{ color: '#94a3b8', textDecoration: 'none' }}>Planes</a>
            <a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>Preguntas</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onLoginClick}
              style={{
                padding: '9px 18px',
                backgroundColor: 'transparent',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Iniciar Sesión
            </button>

            <a
              href="https://wa.me/50688888888?text=Hola%2C%20quiero%20solicitar%20una%20demostraci%C3%B3n%20de%20Betico%20AI"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <MessageSquare size={16} /> Solicitar Demo
            </a>
          </div>

        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: '90px 24px 60px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: '#34d399',
          marginBottom: '24px'
        }}>
          <Sparkles size={16} />
          <span>Inteligencia Artificial Operativa Diseñada para Costa Rica</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: '800',
          lineHeight: '1.15',
          letterSpacing: '-1px',
          margin: '0 0 20px 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Automatiza tus Ventas, Citas y Cobros por WhatsApp con IA
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#94a3b8',
          maxWidth: '780px',
          margin: '0 auto 36px auto',
          lineHeight: '1.6'
        }}>
          Atiende clientes 24/7 con audios y texto, verifica comprobantes de <strong style={{ color: '#ffffff' }}>SINPE Móvil en 0 segundos</strong>, gestiona comandas en cocina y despacha con GPS en una sola plataforma.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '60px' }}>
          <a
            href="https://wa.me/50688888888?text=Hola%20Betico%2C%20quiero%20ver%20la%20demostraci%C3%B3n%20en%20vivo"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Zap size={20} /> Probar Demo por WhatsApp
          </a>

          <button
            onClick={onLoginClick}
            style={{
              padding: '14px 28px',
              backgroundColor: '#1e293b',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '1.05rem',
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
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px', fontWeight: '600' }}>
                Simulación en Tiempo Real • WhatsApp & Visión IA
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '9999px', fontWeight: 'bold' }}>
              Respuesta en 0.8s
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '75%', backgroundColor: '#334155', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#38bdf8', fontWeight: 'bold' }}>
                <Volume2 size={16} />
                <span>Nota de Voz (0:08)</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.85rem' }}>
                "Buenas mae! Tienen hamburguesa doble especial para mandar a Escazú?"
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: '#065f46', padding: '14px 18px', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem', color: '#ecfdf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 'bold', color: '#6ee7b7' }}>
                <Bot size={16} /> Betico IA
              </div>
              ¡Pura vida! Claro que sí, tenemos la <strong>Hamburguesa Doble Especial (₡6.500)</strong> disponible en nuestra sede de Escazú 🍔.<br />
              🛵 Envío Express a Escazú: <strong>₡1.500</strong>.<br />
              ¿Deseas que te tome la orden de una vez o prefieres ver nuestro menú digital?
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: '#064e3b', border: '1px solid #059669', padding: '14px 18px', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem', color: '#ecfdf5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#a7f3d0', marginBottom: '6px' }}>
                <ShieldCheck size={18} /> ✅ SINPE Móvil Verificado Automáticamente
              </div>
              <div>Monto detectado: <strong>₡8.000</strong> • Ref: <strong>#948201</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#6ee7b7', marginTop: '4px' }}>
                ⚡ Comanda enviada a la pantalla de cocina (KDS) y motorizado asignado.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID */}
      <section id="caracteristicas" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>
            Todo lo que tu negocio necesita en un solo lugar
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
            Tecnología diseñada para maximizar ventas y eliminar tareas manuales.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Headphones size={24} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Notas de Voz con IA Multimodal</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Tus clientes no tienen que escribir. Betico escucha notas de voz, extrae pedidos o reservas y responde con fluidez en lenguaje natural.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Smartphone size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Validación Instantánea de SINPE Móvil</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Cero fraudes y cero esperas. El lector con visión artificial confirma transferencias bancarias en 0 segundos y emite campanadas a cocina.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Utensils size={24} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Pantallas de Cocina KDS en Vivo</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Reemplaza comandas de papel por pantallas táctiles con WebSockets a 0 ms, cronómetro de preparación y aviso al cliente cuando su pedido está listo.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Building2 size={24} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Multi-Sucursal & Franquicias</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Administra todas tus sedes físicas de forma centralizada con inventario y cuentas SINPE independientes por local.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(236, 72, 153, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <MapPin size={24} color="#f472b6" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Envíos Express GPS & Correos CR</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Cálculo de costo de envío por distancia GPS exacta con navegación Waze para motorizados y tarifas automáticas GAM/Rural de Correos de Costa Rica.
            </p>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(14, 165, 233, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Send size={24} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>Difusiones Masivas con Redis</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Envía promociones y catálogos a miles de clientes con control de flujo anti-baneo (3.5s) y auto-recuperación de envíos ante reinicios.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ROI CALCULATOR */}
      <section id="roi" style={{ padding: '80px 24px', backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>
            Calcula el Impacto de Betico en tu Negocio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: '0 0 40px 0' }}>
            Mide cuántas horas de trabajo manual y dinero recuperarás al automatizar tu WhatsApp.
          </p>

          <div style={{ backgroundColor: '#1e293b', padding: '36px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px', marginBottom: '36px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Mensajes diarios en WhatsApp:</label>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Ticket promedio de venta:</label>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Clock size={16} color="#38bdf8" /> Tiempo Ahorrado al Mes
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8' }}>
                  {hoursSavedPerMonth} horas
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Equivalente a más de media jornada laboral
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <TrendingUp size={16} color="#34d399" /> Ventas Recuperadas Estimadas
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>
                  ₡{estimatedRecoveredSales.toLocaleString('es-CR')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Por respuestas en menos de 1 segundo 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLANES */}
      <section id="planes" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>
            Planes Transparentes para Todo Tipo de Negocio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
            Sin contratos forzosos. Cancela o cambia de plan en cualquier momento.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#131c2e', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 6px 0' }}>Emprendedor</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0' }}>Ideal para negocios que inician en WhatsApp</p>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '24px' }}>
              $29 <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> 1 Número de WhatsApp Conectado</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Agente IA 24/7 (Texto)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Catálogo / Tienda Digital</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Agenda & Citas Básica</li>
            </ul>
            <button onClick={onLoginClick} style={{ padding: '12px', backgroundColor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Elegir Emprendedor
            </button>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '20px', border: '2px solid #10b981', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.3)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '9999px' }}>
              MÁS POPULAR
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 6px 0' }}>Profesional</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0' }}>Para restaurantes, clínicas y tiendas activas</p>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '24px' }}>
              $59 <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Audios & Notas de Voz con IA</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Validación Automática de SINPE Móvil</strong></li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Pantalla de Cocina (KDS) en Vivo</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Portal de Repartidores con Waze</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> Difusiones Masivas CRM</li>
            </ul>
            <button onClick={onLoginClick} style={{ padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              Comenzar con Pro
            </button>
          </div>

          <div style={{ backgroundColor: '#131c2e', padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 6px 0' }}>Franquicias / Multi-Sede</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0' }}>Cadenas y negocios con múltiples locales</p>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '24px' }}>
              $119 <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#10b981" /> <strong>Hasta 5 Sucursales Incluidas</strong></li>
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

      {/* 6. FAQ */}
      <section id="faq" style={{ padding: '80px 24px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>Preguntas Frecuentes</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Resolvemos tus dudas sobre cómo funciona Betico.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    fontWeight: '700',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#10b981" /> : <ChevronDown size={18} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px 20px', color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer style={{
        backgroundColor: '#080c14',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '50px 24px 30px 24px',
        color: '#94a3b8',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', marginBottom: '30px' }}>
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '800', fontSize: '1.2rem', marginBottom: '10px' }}>
              <Bot size={22} color="#10b981" /> Betico.tech
            </div>
            <p style={{ margin: 0, lineHeight: '1.6' }}>
              Plataforma SaaS con Inteligencia Artificial para la gestión integral de ventas, pedidos, reservas y cobros automáticos por WhatsApp.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '12px' }}>Plataforma</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#caracteristicas" style={{ color: '#94a3b8', textDecoration: 'none' }}>Características</a>
                <a href="#modulos" style={{ color: '#94a3b8', textDecoration: 'none' }}>Módulos</a>
                <a href="#planes" style={{ color: '#94a3b8', textDecoration: 'none' }}>Planes & Precios</a>
                <button onClick={onLoginClick} style={{ color: '#10b981', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' }}>
                  Acceso al Panel
                </button>
              </div>
            </div>

            <div>
              <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '12px' }}>Legal & Privacidad</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="/politica-de-privacidad" style={{ color: '#94a3b8', textDecoration: 'none' }}>Política de Privacidad</a>
                <a href="/terminos-y-condiciones" style={{ color: '#94a3b8', textDecoration: 'none' }}>Términos del Servicio</a>
                <span>Ley N° 8968 Costa Rica</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>© 2026 Betico.tech. Todos los derechos reservados. San José, Costa Rica.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} color="#10b981" /> Cifrado de nivel bancario AES-256
          </div>
        </div>
      </footer>

    </div>
  );
}
