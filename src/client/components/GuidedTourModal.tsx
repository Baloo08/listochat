import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  Globe,
  ShoppingBag,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  QrCode,
  CheckCircle2
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export default function GuidedTourModal({ isOpen, onClose, onNavigateToTab }: GuidedTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '¡Bienvenido a Betico! 🎉',
      subtitle: 'Tu plataforma todo-en-uno de IA, Sitio Web, Tienda y Citas',
      description: 'Acabas de activar tu cuenta con 15 días de prueba gratuita. En este breve recorrido de 1 minuto te mostraremos cómo sacarle el máximo provecho para automatizar tus ventas.',
      icon: <Sparkles size={32} color="#10b981" />,
      targetTab: 'dashboard',
      actionLabel: 'Comenzar Recorrido'
    },
    {
      title: '📱 Paso 1: Conecta tu WhatsApp',
      subtitle: 'Escanea el código QR en menos de 1 minuto',
      description: 'Ingresa a la sección "WhatsApp" y escanea el código QR desde tu teléfono. Tu número actual empezará a responder consultas, tomar pedidos y agendar citas 24/7 de forma automática.',
      icon: <QrCode size={32} color="#2563eb" />,
      targetTab: 'whatsapp',
      actionLabel: 'Ir a Conectar WhatsApp'
    },
    {
      title: '🤖 Paso 2: Configura tu Agente Betico IA',
      subtitle: 'Motor propio de IA sin cargos extras por tokens',
      description: 'En "Estudio Agente IA" puedes definir la personalidad de tu asistente, reglas de atención, modismos y qué hacer cuando un cliente solicite hablar con una persona del equipo.',
      icon: <Bot size={32} color="#10b981" />,
      targetTab: 'agente',
      actionLabel: 'Ir a Estudio Agente IA'
    },
    {
      title: '🌐 Paso 3: Tu Sitio Web Oficial & Tienda',
      subtitle: 'Crea tu página web en minutos con tu enlace oficial',
      description: 'Desde "Sitio Web Oficial" puedes subir tu logotipo para fondos claros y oscuros, elegir tus colores corporativos, estilo de portada y activar los botones directos de tienda y citas.',
      icon: <Globe size={32} color="#3b82f6" />,
      targetTab: 'website_builder',
      actionLabel: 'Ir a Creador de Sitios Web'
    },
    {
      title: '🛒 Paso 4: Catálogo, Menú y Verificación SINPE',
      subtitle: 'Visión artificial para validar comprobantes bancarios al instante',
      description: 'En "Productos / Menú" y "Servicios" agrega tus platillos o servicios. Cuando un cliente te envíe un comprobante SINPE por WhatsApp, Betico IA lo validará y despachará el pedido automáticamente.',
      icon: <ShieldCheck size={32} color="#f59e0b" />,
      targetTab: 'productos',
      actionLabel: 'Ir a Catálogo de Productos'
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('betico_tour_dismissed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (onNavigateToTab && step.targetTab) {
      onNavigateToTab(step.targetTab);
    }
    handleNext();
  };

  const handleSkip = () => {
    localStorage.setItem('betico_tour_dismissed', 'true');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(8, 13, 26, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        width: '100%',
        maxWidth: '560px',
        padding: '32px 28px',
        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        
        {/* Skip button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Omitir <X size={18} />
        </button>

        {/* Step Indicator Pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: idx <= currentStep ? '#10b981' : 'rgba(255,255,255,0.12)',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>

        {/* Icon Circle */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '18px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {step.icon}
        </div>

        {/* Title and Content */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          {step.title}
        </h2>
        <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '700', marginBottom: '14px' }}>
          {step.subtitle}
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 28px 0' }}>
          {step.description}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 16px',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} /> Anterior
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && currentStep < steps.length && (
              <button
                onClick={handleAction}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#1e293b',
                  color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {step.actionLabel}
              </button>
            )}

            <button
              onClick={handleNext}
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
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {currentStep === steps.length - 1 ? '¡Comenzar a Vender! 🎉' : 'Siguiente'} <ArrowRight size={16} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
