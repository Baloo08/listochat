import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Sparkles, MessageCircle, AlertCircle, Palmtree, MapPin, Sliders } from 'lucide-react';
import { BookingField } from '../shared/types';

interface PublicBookingViewProps {
  slug: string;
}

export default function PublicBookingView({ slug }: PublicBookingViewProps) {
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow Steps
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceVariables, setServiceVariables] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [vacationAlert, setVacationAlert] = useState<string | null>(null);

  // Standard Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/appointments/public/${slug}/info`);
        if (!res.ok) throw new Error('Negocio no encontrado');
        const data = await res.json();
        setBusinessInfo(data);
        setServices(data.services || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar información');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [slug]);

  // Load custom Google Font dynamically
  useEffect(() => {
    if (businessInfo?.theme?.fontFamily) {
      const font = businessInfo.theme.fontFamily;
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [businessInfo?.theme?.fontFamily]);

  useEffect(() => {
    if (!selectedDate || !slug) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(null);
      setVacationAlert(null);
      try {
        const res = await fetch(`/api/appointments/public/${slug}/available-slots?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isVacation) {
            setVacationAlert(data.vacationMessage || 'Estaremos cerrados temporalmente por vacaciones.');
            setAvailableSlots([]);
          } else {
            setAvailableSlots(data.availableSlots || []);
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, slug]);

  const handleSelectService = (svc: any) => {
    setSelectedService(svc);
    const initialVars: Record<string, any> = {};
    if (svc.customVariables && Array.isArray(svc.customVariables)) {
      svc.customVariables.forEach((group: any) => {
        if (group.options && group.options.length > 0) {
          initialVars[group.name] = group.options[0].name;
        }
      });
    }
    setServiceVariables(initialVars);
  };

  const calculateEffectivePrice = (svc: any, vars: Record<string, any>) => {
    let p = Number(svc?.price || 0);
    if (!svc?.customVariables || !Array.isArray(svc.customVariables)) return p;
    for (const group of svc.customVariables) {
      const val = vars[group.name];
      if (!val) continue;
      const opt = group.options?.find((o: any) => o.name === val);
      if (opt && opt.priceDelta) p += Number(opt.priceDelta);
    }
    return p;
  };

  const calculateEffectiveMinutes = (svc: any, vars: Record<string, any>) => {
    let m = Number(svc?.estimatedMinutes || 45);
    if (!svc?.customVariables || !Array.isArray(svc.customVariables)) return m;
    for (const group of svc.customVariables) {
      const val = vars[group.name];
      if (!val) continue;
      const opt = group.options?.find((o: any) => o.name === val);
      if (opt && opt.durationMinutesDelta) m += Number(opt.durationMinutesDelta);
    }
    return m;
  };

  const handleCustomAnswerChange = (fieldLabel: string, val: string) => {
    setCustomAnswers(prev => ({ ...prev, [fieldLabel]: val }));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Validate required custom fields
    const customFields: BookingField[] = businessInfo?.customFields || [];
    for (const field of customFields) {
      if (field.required && !customAnswers[field.label]?.trim()) {
        alert(`Por favor responde la pregunta obligatoria: "${field.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const effectiveAmount = calculateEffectivePrice(selectedService, serviceVariables);

      const res = await fetch(`/api/appointments/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: selectedService.name,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          amount: effectiveAmount,
          customerName,
          customerPhone,
          selectedVariables: serviceVariables,
          customAnswers
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al agendar cita');
      }

      const data = await res.json();
      setBookingSuccess(data);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = businessInfo?.theme?.primaryColor || '#16a34a';
  const bgColor = businessInfo?.theme?.backgroundColor || '#f8fafc';
  const cardBg = businessInfo?.theme?.cardBackgroundColor || '#ffffff';
  const fontFamily = businessInfo?.theme?.fontFamily || 'Inter, sans-serif';
  const cardRadius = businessInfo?.theme?.cardRadius === 'pill' ? '20px' : businessInfo?.theme?.cardRadius === 'square' ? '4px' : '12px';
  const cardShadow = businessInfo?.theme?.cardShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : businessInfo?.theme?.cardShadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0,0,0,0.07)';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, fontFamily }}>
        <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Cargando portal de reservas...</p>
      </div>
    );
  }

  if (error || !businessInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 15px auto' }} />
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>Portal no disponible</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>El enlace ingresado no corresponde a ningún negocio activo en Betico.</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    const finalPrice = calculateEffectivePrice(selectedService, serviceVariables);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bgColor, padding: '40px 20px', fontFamily }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', backgroundColor: cardBg, borderRadius: cardRadius, padding: '35px', textAlign: 'center', boxShadow: cardShadow, border: '1px solid #e2e8f0' }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle size={40} color="#166534" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#166534', margin: '0 0 8px 0', fontWeight: 'bold' }}>
            ¡Cita Agendada con Éxito!
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0' }}>
            Hemos registrado tu reserva en <strong>{businessInfo.name}</strong> y enviado una confirmación a tu WhatsApp.
          </p>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '25px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <div><strong>Servicio:</strong> {selectedService?.name}</div>
            {Object.keys(serviceVariables).length > 0 && (
              <div><strong>Opciones:</strong> {Object.entries(serviceVariables).map(([k, v]) => `${k}: ${v}`).join(' • ')}</div>
            )}
            <div><strong>Fecha:</strong> {selectedDate}</div>
            <div><strong>Hora:</strong> {selectedTime}</div>
            <div><strong>Cliente:</strong> {customerName} ({customerPhone})</div>
            {finalPrice > 0 && <div><strong>Monto estimado:</strong> ₡{finalPrice.toLocaleString('es-CR')}</div>}
          </div>

          {businessInfo.whatsappNumber && (
            <a
              href={`https://wa.me/${businessInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, acabo de agendar una cita para ${selectedService?.name} el ${selectedDate} a las ${selectedTime}. Mi nombre es ${customerName}.`)}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', marginBottom: '15px' }}
            >
              <MessageCircle size={20} /> Escribir al WhatsApp del Negocio
            </a>
          )}

          <button
            onClick={() => {
              setBookingSuccess(null);
              setSelectedService(null);
              setSelectedTime(null);
              setServiceVariables({});
              setCustomAnswers({});
            }}
            style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  const customFields: BookingField[] = businessInfo.customFields || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily, color: '#1e293b', paddingBottom: '60px' }}>
      
      {/* Optional Top Banner */}
      {businessInfo.bannerUrl && (
        <div style={{ width: '100%', aspectRatio: '16 / 5', minHeight: '140px', maxHeight: '300px', overflow: 'hidden', position: 'relative' }}>
          <img src={businessInfo.bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))' }} />
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', backgroundColor: cardBg, borderRadius: cardRadius, padding: '20px', border: '1px solid #e2e8f0', boxShadow: cardShadow }}>
          {businessInfo.logoUrl ? (
            <img src={businessInfo.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {businessInfo.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>{businessInfo.name}</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Agenda tu cita en línea de forma rápida y sencilla</p>
          </div>
        </div>

        {/* Step 1: Select Service */}
        <div style={{ backgroundColor: cardBg, borderRadius: cardRadius, padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: cardShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ width: '26px', height: '26px', backgroundColor: primaryColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>1</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Selecciona el Servicio</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {services.map(svc => {
              const isSelected = selectedService?.id === svc.id;
              const hasVars = svc.customVariables && svc.customVariables.length > 0;
              const price = isSelected ? calculateEffectivePrice(svc, serviceVariables) : Number(svc.price || 0);
              const minutes = isSelected ? calculateEffectiveMinutes(svc, serviceVariables) : (svc.estimatedMinutes || 45);

              return (
                <div
                  key={svc.id}
                  onClick={() => handleSelectService(svc)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                    backgroundColor: isSelected ? `${primaryColor}0a` : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isSelected ? primaryColor : '#1e293b' }}>{svc.name}</div>
                      {svc.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{svc.description}</div>}
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>⏱️ {minutes} minutos</div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: primaryColor }}>
                      ₡{price.toLocaleString('es-CR')}
                    </div>
                  </div>

                  {/* Variables selection if active service is selected */}
                  {isSelected && hasVars && (
                    <div style={{ paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={e => e.stopPropagation()}>
                      {svc.customVariables.map((group: any) => (
                        <div key={group.id}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                            {group.name}:
                          </label>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {group.options.map((opt: any) => {
                              const isOptSelected = serviceVariables[group.name] === opt.name;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setServiceVariables(prev => ({ ...prev, [group.name]: opt.name }))}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px',
                                    border: isOptSelected ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                                    backgroundColor: isOptSelected ? primaryColor : 'white',
                                    color: isOptSelected ? 'white' : '#1e293b',
                                    fontWeight: isOptSelected ? 'bold' : 'normal',
                                    fontSize: '0.8rem', cursor: 'pointer'
                                  }}
                                >
                                  {opt.name} {opt.priceDelta ? `(+₡${opt.priceDelta.toLocaleString('es-CR')})` : ''} {opt.durationMinutesDelta ? `(+${opt.durationMinutesDelta} min)` : ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date and Time Slot */}
        {selectedService && (
          <div style={{ backgroundColor: cardBg, borderRadius: cardRadius, padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ width: '26px', height: '26px', backgroundColor: primaryColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>2</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Selecciona Fecha y Horario</h3>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>
                <Calendar size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Fecha de la Cita:
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            {/* Vacation Alert */}
            {vacationAlert && (
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Palmtree size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Cierre Temporal / Vacaciones</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>{vacationAlert}</div>
                </div>
              </div>
            )}

            {!vacationAlert && (
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>
                  <Clock size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Horarios Disponibles:
                </label>

                {loadingSlots ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Consultando horarios disponibles...</div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay horarios disponibles para la fecha seleccionada. Por favor elige otro día.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '8px' }}>
                    {availableSlots.map(time => {
                      const isTimeSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          style={{
                            padding: '10px 0',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: `2px solid ${isTimeSelected ? primaryColor : '#e2e8f0'}`,
                            backgroundColor: isTimeSelected ? primaryColor : 'white',
                            color: isTimeSelected ? 'white' : '#1e293b',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer Information & Custom Questions */}
        {selectedService && selectedTime && (
          <form onSubmit={handleBook} style={{ backgroundColor: cardBg, borderRadius: cardRadius, padding: '24px', border: '1px solid #e2e8f0', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ width: '26px', height: '26px', backgroundColor: primaryColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>3</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Tus Datos de Contacto</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre y Apellidos *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Ej: María González"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>WhatsApp de Contacto *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 8888-8888"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Te enviaremos los detalles y recordatorios a este número.</span>
              </div>

              {/* Dynamic Business Custom Fields */}
              {customFields.map((field) => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={customAnswers[field.label] || ''}
                      onChange={(e) => handleCustomAnswerChange(field.label, e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: 'white' }}
                    >
                      <option value="">Selecciona una opción...</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      value={customAnswers[field.label] || ''}
                      onChange={(e) => handleCustomAnswerChange(field.label, e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  )}
                </div>
              ))}

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  {submitting ? 'Agendando cita...' : `Confirmar Cita • ₡${calculateEffectivePrice(selectedService, serviceVariables).toLocaleString('es-CR')}`}
                </button>
              </div>

            </div>
          </form>
        )}

      </div>

    </div>
  );
}
