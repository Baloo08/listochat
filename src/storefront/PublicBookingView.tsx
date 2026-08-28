import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Sparkles, MessageCircle, AlertCircle, Palmtree, MapPin } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [vacationAlert, setVacationAlert] = useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [details, setDetails] = useState('');
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
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
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

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: selectedService.name,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerPhone,
          vehicleModel,
          details
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
            <div><strong>Fecha:</strong> {selectedDate}</div>
            <div><strong>Hora:</strong> {selectedTime}</div>
            <div><strong>Cliente:</strong> {customerName} ({customerPhone})</div>
            {selectedService?.price > 0 && <div><strong>Monto estimado:</strong> ₡{Number(selectedService.price).toLocaleString('es-CR')}</div>}
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
            }}
            style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily, color: '#1e293b', paddingBottom: '60px' }}>
      
      {/* Optional Top Banner */}
      {businessInfo.bannerUrl && (
        <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
          <img src={businessInfo.bannerUrl} alt={businessInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
        </div>
      )}

      {/* Hero Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '25px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          {businessInfo.logoUrl && (
            <img src={businessInfo.logoUrl} alt={businessInfo.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px auto', display: 'block', border: '2px solid #e2e8f0' }} />
          )}
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 'bold' }}>{businessInfo.name}</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Portal Oficial de Reservas y Agendamiento Online</p>
        </div>
      </div>

      <div style={{ maxWidth: '650px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* Step 1: Select Service */}
        <div style={{ backgroundColor: cardBg, borderRadius: cardRadius, padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: cardShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ width: '26px', height: '26px', backgroundColor: primaryColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>1</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Selecciona el Servicio</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {services.map(svc => {
              const isSelected = selectedService?.id === svc.id;
              return (
                <div
                  key={svc.id}
                  onClick={() => setSelectedService(svc)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? primaryColor : '#e2e8f0'}`,
                    backgroundColor: isSelected ? `${primaryColor}0a` : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: isSelected ? primaryColor : '#1e293b' }}>{svc.name}</div>
                    {svc.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{svc.description}</div>}
                    {svc.duration && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>⏱️ {svc.duration}</div>}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: primaryColor }}>
                    ₡{Number(svc.price || 0).toLocaleString('es-CR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2 & 3: Date and Time Slot */}
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

        {/* Step 3: Customer Details Form */}
        {selectedService && selectedTime && !vacationAlert && (
          <form onSubmit={handleBook} style={{ backgroundColor: cardBg, borderRadius: cardRadius, padding: '24px', border: '1px solid #e2e8f0', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ width: '26px', height: '26px', backgroundColor: primaryColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>3</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Ingresa tus Datos de Contacto</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Carlos Murillo"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 8888-8888"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'block' }}>Te enviaremos la confirmación y recordatorio a este número.</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Detalle o Vehículo (Opcional)</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Ej: Toyota RAV4 2022 o Consulta General"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Notas o Comentarios Adicionales</label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Cualquier indicación especial para tu cita..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '25px' }}>
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
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              >
                {submitting ? 'Confirmando Reserva...' : `Confirmar Cita para el ${selectedDate} a las ${selectedTime}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
