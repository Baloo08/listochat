import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShoppingBag,
  Calendar,
  Trophy,
  Gift,
  FileText,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Check,
  Scissors,
  ShieldCheck,
  Zap,
  Package,
  Building2
} from 'lucide-react';
import { StoreModulesConfig } from '../../shared/types';

export interface OnboardingPurposeOption {
  id: 'reservas' | 'tienda' | 'whatsapp' | 'fidelidad';
  label: string;
}

export interface OnboardingNicheOption {
  id: 'barberia' | 'tienda_minorista' | 'clinica' | 'estudio_ejercicio' | 'cancha_sintetica' | 'restaurante' | 'otro';
  label: string;
}

export interface SixModuleMeta {
  key: 'whatsapp' | 'tienda' | 'reservas' | 'canchas' | 'fidelizacion' | 'facturacion';
  label: string;
  defaultTab: string;
}

export const ONBOARDING_PURPOSES: OnboardingPurposeOption[] = [
  { id: 'reservas', label: 'Tener una página de reservas' },
  { id: 'tienda', label: 'Tener una tienda' },
  { id: 'whatsapp', label: 'Responder WhatsApp de forma automática' },
  { id: 'fidelidad', label: 'Tener una tarjeta de fidelización' }
];

export const ONBOARDING_NICHES: OnboardingNicheOption[] = [
  { id: 'barberia', label: 'Barbería' },
  { id: 'tienda_minorista', label: 'Tienda minorista' },
  { id: 'clinica', label: 'Clínica' },
  { id: 'estudio_ejercicio', label: 'Estudio de ejercicio' },
  { id: 'cancha_sintetica', label: 'Cancha sintética' },
  { id: 'restaurante', label: 'Restaurante o Cafetería' },
  { id: 'otro', label: 'Otro negocio' }
];

export const SIX_MODULES_CATALOG: SixModuleMeta[] = [
  { key: 'whatsapp', label: 'Asistente de WhatsApp', defaultTab: 'whatsapp' },
  { key: 'tienda', label: 'Tienda', defaultTab: 'productos' },
  { key: 'reservas', label: 'Reservas', defaultTab: 'reservas' },
  { key: 'canchas', label: 'Canchas', defaultTab: 'canchas_reservas' },
  { key: 'fidelizacion', label: 'Tarjetas de fidelización', defaultTab: 'fidelidad_ajustes' },
  { key: 'facturacion', label: 'Cobros y Facturación', defaultTab: 'facturacion_comprobantes' }
];

export interface SuggestedModulesResult {
  whatsappEnabled: boolean;
  storeEnabled: boolean;
  bookingsEnabled: boolean;
  courtsEnabled: boolean;
  loyaltyEnabled: boolean;
  billingEnabled: boolean;
  storeMode: 'retail' | 'restaurant';
}

export function computeSuggestedModules(
  purposes: string[] = [],
  niche: string = ''
): SuggestedModulesResult {
  const cleanPurposes = Array.isArray(purposes) ? purposes : [];
  const cleanNiche = (niche || '').trim().toLowerCase();

  let whatsappEnabled = cleanPurposes.includes('whatsapp');
  let storeEnabled =
    cleanPurposes.includes('tienda') ||
    cleanNiche === 'tienda_minorista' ||
    cleanNiche === 'restaurante';
  let bookingsEnabled =
    cleanPurposes.includes('reservas') ||
    cleanNiche === 'barberia' ||
    cleanNiche === 'clinica' ||
    cleanNiche === 'estudio_ejercicio';
  let courtsEnabled =
    cleanNiche === 'cancha_sintetica' ||
    cleanPurposes.includes('canchas');
  let loyaltyEnabled =
    cleanPurposes.includes('fidelidad') ||
    cleanPurposes.includes('fidelizacion');
  let billingEnabled =
    cleanPurposes.includes('facturacion') ||
    cleanNiche === 'clinica' ||
    cleanNiche === 'tienda_minorista' ||
    cleanNiche === 'restaurante';

  if (
    !whatsappEnabled &&
    !storeEnabled &&
    !bookingsEnabled &&
    !courtsEnabled &&
    !loyaltyEnabled &&
    !billingEnabled
  ) {
    whatsappEnabled = true;
  }

  return {
    whatsappEnabled,
    storeEnabled,
    bookingsEnabled,
    courtsEnabled,
    loyaltyEnabled,
    billingEnabled,
    storeMode: cleanNiche === 'restaurante' ? 'restaurant' : 'retail'
  };
}

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabId: string) => void;
  currentModules?: StoreModulesConfig;
  currentStoreMode?: 'retail' | 'restaurant';
  onApplyConfiguration?: (config: {
    storeModules: StoreModulesConfig;
    storeMode: 'retail' | 'restaurant';
  }) => void;
}

export default function GuidedTourModal({
  isOpen,
  onClose,
  onNavigateToTab,
  currentModules,
  currentStoreMode = 'retail',
  onApplyConfiguration
}: GuidedTourModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(() => {
    if (currentModules?.businessPurposes && currentModules.businessPurposes.length > 0) {
      return currentModules.businessPurposes;
    }
    return ['whatsapp'];
  });
  const [selectedNiche, setSelectedNiche] = useState<string>(() => {
    return currentModules?.businessNiche || '';
  });

  const [suggestedState, setSuggestedState] = useState<SuggestedModulesResult>(() =>
    computeSuggestedModules(['whatsapp'], '')
  );
  const [activeSelection, setActiveSelection] = useState<Record<string, boolean>>({
    whatsapp: true,
    tienda: true,
    reservas: true,
    canchas: false,
    fidelizacion: false,
    facturacion: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (currentModules?.businessPurposes && currentModules.businessPurposes.length > 0) {
        setSelectedPurposes(currentModules.businessPurposes);
      }
      if (currentModules?.businessNiche) {
        setSelectedNiche(currentModules.businessNiche);
      }
    }
  }, [isOpen, currentModules?.businessNiche, currentModules?.businessPurposes]);

  if (!isOpen) return null;

  const togglePurpose = (id: string) => {
    setSelectedPurposes(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGoToStep2 = () => {
    if (selectedPurposes.length === 0) {
      setSelectedPurposes(['whatsapp']);
    }
    setStep(2);
  };

  const handleGoToStep3 = (nicheOverride?: string) => {
    const finalNiche = nicheOverride !== undefined ? nicheOverride : selectedNiche;
    const computed = computeSuggestedModules(selectedPurposes, finalNiche);
    setSuggestedState(computed);
    setActiveSelection({
      whatsapp: computed.whatsappEnabled,
      tienda: computed.storeEnabled,
      reservas: computed.bookingsEnabled,
      canchas: computed.courtsEnabled,
      fidelizacion: computed.loyaltyEnabled,
      facturacion: computed.billingEnabled
    });
    setStep(3);
  };

  const toggleModuleKey = (key: string) => {
    setActiveSelection(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    const hasAtLeastOne = Object.values(activeSelection).some(Boolean);
    const finalWhatsapp = hasAtLeastOne ? Boolean(activeSelection.whatsapp) : true;

    const updatedModules: StoreModulesConfig = {
      ...currentModules,
      whatsappEnabled: finalWhatsapp,
      storeEnabled: Boolean(activeSelection.tienda),
      bookingsEnabled: Boolean(activeSelection.reservas),
      courtsEnabled: Boolean(activeSelection.canchas),
      loyaltyEnabled: Boolean(activeSelection.fidelizacion),
      billingEnabled: Boolean(activeSelection.facturacion),
      onboardingCompleted: true,
      businessNiche: selectedNiche || 'otro',
      businessPurposes: selectedPurposes
    };

    const nextMode: 'retail' | 'restaurant' =
      selectedNiche === 'restaurante' ? 'restaurant' : currentStoreMode;

    try {
      localStorage.setItem('betico_tour_dismissed', 'true');
      localStorage.setItem('betico_onboarding_done', 'true');
      localStorage.removeItem('betico_tour_active');
    } catch (e) {}

    if (onApplyConfiguration) {
      await onApplyConfiguration({
        storeModules: updatedModules,
        storeMode: nextMode
      });
    }

    const firstEnabled = SIX_MODULES_CATALOG.find(m =>
      m.key === 'whatsapp' ? updatedModules.whatsappEnabled :
      m.key === 'tienda' ? updatedModules.storeEnabled :
      m.key === 'reservas' ? updatedModules.bookingsEnabled :
      m.key === 'canchas' ? updatedModules.courtsEnabled :
      m.key === 'fidelizacion' ? updatedModules.loyaltyEnabled :
      updatedModules.billingEnabled
    );

    if (onNavigateToTab && firstEnabled) {
      onNavigateToTab(firstEnabled.defaultTab);
    }

    setSaving(false);
    onClose();
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('betico_tour_dismissed', 'true');
      localStorage.setItem('betico_onboarding_done', 'true');
      localStorage.removeItem('betico_tour_active');
    } catch (e) {}
    onClose();
  };

  const renderPurposeIcon = (id: string) => {
    switch (id) {
      case 'reservas': return <Calendar size={20} />;
      case 'tienda': return <ShoppingBag size={20} />;
      case 'whatsapp': return <MessageSquare size={20} />;
      case 'fidelidad': return <Gift size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const renderNicheIcon = (id: string) => {
    switch (id) {
      case 'barberia': return <Scissors size={19} />;
      case 'tienda_minorista': return <ShoppingBag size={19} />;
      case 'clinica': return <ShieldCheck size={19} />;
      case 'estudio_ejercicio': return <Zap size={19} />;
      case 'cancha_sintetica': return <Trophy size={19} />;
      case 'restaurante': return <Package size={19} />;
      default: return <Building2 size={19} />;
    }
  };

  const renderModuleIcon = (key: string) => {
    switch (key) {
      case 'whatsapp': return <MessageSquare size={19} />;
      case 'tienda': return <ShoppingBag size={19} />;
      case 'reservas': return <Calendar size={19} />;
      case 'canchas': return <Trophy size={19} />;
      case 'fidelizacion': return <Gift size={19} />;
      case 'facturacion': return <FileText size={19} />;
      default: return <Sparkles size={19} />;
    }
  };

  const isSuggestedKey = (key: string) => {
    if (key === 'whatsapp') return suggestedState.whatsappEnabled;
    if (key === 'tienda') return suggestedState.storeEnabled;
    if (key === 'reservas') return suggestedState.bookingsEnabled;
    if (key === 'canchas') return suggestedState.courtsEnabled;
    if (key === 'fidelizacion') return suggestedState.loyaltyEnabled;
    if (key === 'facturacion') return suggestedState.billingEnabled;
    return false;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '520px',
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
          position: 'relative',
          color: '#0f172a',
          fontFamily: "'Poppins', 'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          title="Cerrar"
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={17} />
        </button>

        {/* Minimalist Step Progress */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', paddingRight: '36px' }}>
          {[1, 2, 3].map(idx => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '9999px',
                backgroundColor: idx <= step ? 'var(--primary, #0b3c3d)' : '#e2e8f0',
                transition: 'background-color 0.25s ease'
              }}
            />
          ))}
        </div>

        {/* STEP 1: ¿Para qué necesitas la app? */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              ¿Para qué necesitas la app?
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {ONBOARDING_PURPOSES.map(option => {
                const selected = selectedPurposes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => togglePurpose(option.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: selected ? '2px solid var(--primary, #0b3c3d)' : '1px solid #e2e8f0',
                      backgroundColor: selected ? 'var(--primary-light, #e6f4f1)' : '#f8fafc',
                      color: '#0f172a',
                      fontWeight: selected ? 700 : 600,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: selected ? 'var(--primary, #0b3c3d)' : '#64748b', display: 'flex' }}>
                        {renderPurposeIcon(option.id)}
                      </span>
                      <span>{option.label}</span>
                    </div>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: selected ? 'none' : '1.5px solid #cbd5e1',
                        backgroundColor: selected ? 'var(--primary, #0b3c3d)' : '#ffffff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {selected && <Check size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleGoToStep2}
                style={{
                  padding: '11px 20px',
                  backgroundColor: 'var(--primary, #0b3c3d)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Siguiente</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ¿Cuál es tu nicho de negocio? */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>
              ¿Cuál es tu nicho de negocio?
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '10px',
                marginBottom: '24px'
              }}
            >
              {ONBOARDING_NICHES.map(niche => {
                const selected = selectedNiche === niche.id;
                return (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => {
                      setSelectedNiche(niche.id);
                      handleGoToStep3(niche.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '13px 14px',
                      borderRadius: '12px',
                      border: selected ? '2px solid var(--primary, #0b3c3d)' : '1px solid #e2e8f0',
                      backgroundColor: selected ? 'var(--primary-light, #e6f4f1)' : '#f8fafc',
                      color: '#0f172a',
                      fontWeight: selected ? 700 : 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ color: selected ? 'var(--primary, #0b3c3d)' : '#64748b', display: 'flex' }}>
                      {renderNicheIcon(niche.id)}
                    </span>
                    <span>{niche.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoToStep3()}
                style={{
                  padding: '11px 20px',
                  backgroundColor: 'var(--primary, #0b3c3d)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Siguiente</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Configuración sugerida (6 Módulos) */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.22rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>
              Configuración sugerida
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              {SIX_MODULES_CATALOG.map(mod => {
                const isSelected = Boolean(activeSelection[mod.key]);
                const isSuggested = isSuggestedKey(mod.key);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModuleKey(mod.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary, #0b3c3d)' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? 'var(--primary-light, #e6f4f1)' : '#f8fafc',
                      color: '#0f172a',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: isSelected ? 'var(--primary, #0b3c3d)' : '#64748b', display: 'flex' }}>
                        {renderModuleIcon(mod.key)}
                      </span>
                      <span>{mod.label}</span>
                      {isSuggested && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}
                        >
                          Sugerido
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                        backgroundColor: isSelected ? 'var(--primary, #0b3c3d)' : '#ffffff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                style={{
                  padding: '11px 22px',
                  backgroundColor: 'var(--primary, #0b3c3d)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                <span>{saving ? 'Guardando...' : 'Aplicar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
