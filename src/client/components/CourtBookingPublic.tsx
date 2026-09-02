import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, DollarSign, Plus, Minus, 
  MapPin, Check, ChevronRight, Clock 
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking, StoreSettings } from '../../shared/types';

export default function CourtBookingPublic({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<'book' | 'open_matches'>('book');
  const [storeInfo, setStoreInfo] = useState<StoreSettings | null>(null);
  
  // Tab 1 state
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingMode, setBookingMode] = useState<'full' | 'seek_match'>('full');
  
  const [teamAName, setTeamAName] = useState('');
  const [teamACaptain, setTeamACaptain] = useState('');
  const [teamAPhone, setTeamAPhone] = useState('');
  const [extraPlayers, setExtraPlayers] = useState(0);
  
  const [teamBName, setTeamBName] = useState('');
  const [teamBCaptain, setTeamBCaptain] = useState('');
  const [teamBPhone, setTeamBPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermedio');

  // Tab 2 state
  const [openMatches, setOpenMatches] = useState<CourtBooking[]>([]);
  const [joiningMatch, setJoiningMatch] = useState<CourtBooking | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const api = useApi();

  useEffect(() => {
    const init = async () => {
      try {
        // We reuse the appointments endpoint to get public info about the tenant
        const info = await api.get(`/api/appointments/public/${slug}/info`);
        setStoreInfo(info);
        
        // Fetch courts for this tenant
        const cData = await api.get(`/api/courts/public/${slug}/courts`);
        if (cData) setCourts(cData);
      } catch (error) {
        console.error('Error fetching public info:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'open_matches') {
      const fetchOpenMatches = async () => {
        try {
          const matches = await api.get(`/api/courts/public/${slug}/open-matches`);
          if (matches) setOpenMatches(matches);
        } catch (error) {
          console.error(error);
        }
      };
      fetchOpenMatches();
    }
  }, [activeTab, slug]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      const fetchSlots = async () => {
        try {
          const slots = await api.get(`/api/courts/public/${slug}/available-slots?courtId=${selectedCourt.id}&date=${selectedDate}`);
          setAvailableSlots(slots || []);
        } catch (error) {
          console.error(error);
          setAvailableSlots([]);
        }
      };
      fetchSlots();
    }
  }, [selectedCourt, selectedDate, slug]);

  const primaryColor = storeInfo?.storeTheme?.primaryColor || '#16a34a';

  const calculateTotal = () => {
    if (!selectedCourt) return 0;
    let total = selectedCourt.basePrice;
    if (extraPlayers > 0) {
      total += extraPlayers * selectedCourt.extraPlayerFee;
    }
    return total;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt || !selectedSlot) return;
    
    setSubmitting(true);
    try {
      const payload = {
        courtId: selectedCourt.id,
        date: selectedDate,
        time: selectedSlot,
        bookingMode,
        teamAName,
        teamACaptain,
        teamAPhone,
        teamAExtraPlayers: extraPlayers,
        teamBName,
        teamBCaptain,
        teamBPhone,
        teamBExtraPlayers: bookingMode === 'full' ? extraPlayers : 0,
        skillLevel: bookingMode === 'seek_match' ? skillLevel : undefined
      };
      
      const res = await api.post(`/api/courts/public/${slug}/book`, payload);
      
      // Open WhatsApp
      const total = calculateTotal();
      let text = `Hola, quiero confirmar mi reserva de cancha.\n\n`;
      text += `📅 Fecha: ${selectedDate}\n⏰ Hora: ${selectedSlot}\n🏆 Cancha: ${selectedCourt.name}\n`;
      if (bookingMode === 'seek_match') {
        text += `⚔️ Modo: Busca Reto\nNivel: ${skillLevel}\n`;
      } else {
        text += `👥 Equipos: ${teamAName} vs ${teamBName}\n`;
      }
      text += `💰 Total: ₡${total.toLocaleString()}\n`;
      
      if (storeInfo?.whatsappNumber) {
        window.location.href = `https://wa.me/${storeInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      } else {
        alert('Reserva creada con éxito. Nos pondremos en contacto.');
        window.location.reload();
      }
      
    } catch (error) {
      alert('Error al procesar reserva. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningMatch) return;
    
    setSubmitting(true);
    try {
      const payload = {
        teamBName,
        teamBCaptain,
        teamBPhone,
        teamBExtraPlayers: extraPlayers
      };
      
      await api.post(`/api/courts/public/${slug}/join-match/${joiningMatch.id}`, payload);
      
      let text = `Hola, quiero unirme al reto abierto.\n\n`;
      text += `📅 Fecha: ${joiningMatch.date}\n⏰ Hora: ${joiningMatch.time}\n🏆 Equipo a retar: ${joiningMatch.teamAName}\n`;
      text += `👥 Mi equipo: ${teamBName} (Capitán: ${teamBCaptain})\n`;
      
      if (storeInfo?.whatsappNumber) {
        window.location.href = `https://wa.me/${storeInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      } else {
        alert('Te has unido al partido con éxito.');
        window.location.reload();
      }
    } catch (error) {
      alert('Error al unirse al partido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando portal...</div>;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: storeInfo?.storeTheme?.backgroundColor || '#f8fafc',
      fontFamily: storeInfo?.storeTheme?.fontFamily || 'system-ui, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{ backgroundColor: primaryColor, padding: '20px', color: 'white', textAlign: 'center' }}>
        {storeInfo?.storeLogoUrl && (
          <img src={storeInfo.storeLogoUrl} alt="Logo" style={{ height: '60px', marginBottom: '10px', borderRadius: '8px' }} />
        )}
        <h1 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{storeInfo?.storeName || 'Reservas Deportivas'}</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>{storeInfo?.storeDescription || 'Reserva tu cancha o encuentra rivales'}</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${primaryColor}`, marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('book')}
            style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: activeTab === 'book' ? primaryColor : 'transparent', color: activeTab === 'book' ? 'white' : primaryColor, fontWeight: 'bold', cursor: 'pointer' }}
          >
            Reservar Cancha
          </button>
          <button
            onClick={() => setActiveTab('open_matches')}
            style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: activeTab === 'open_matches' ? primaryColor : 'transparent', color: activeTab === 'open_matches' ? 'white' : primaryColor, fontWeight: 'bold', cursor: 'pointer' }}
          >
            Partidos Abiertos
          </button>
        </div>

        {/* Tab: Reservar Cancha */}
        {activeTab === 'book' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Step 1: Cancha */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: primaryColor, color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>1</span>
                Elige la cancha
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCourt(c); setSelectedSlot(''); }}
                    style={{
                      padding: '16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                      border: selectedCourt?.id === c.id ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                      backgroundColor: selectedCourt?.id === c.id ? `${primaryColor}10` : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '12px' }}>
                      <span><Users size={12} style={{ display: 'inline' }}/> {c.teamSize} vs {c.teamSize}</span>
                      <span><Clock size={12} style={{ display: 'inline' }}/> {c.durationMinutes} min</span>
                      <span style={{ fontWeight: 'bold', color: primaryColor }}>₡{c.basePrice.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Fecha y Hora */}
            {selectedCourt && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: primaryColor, color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>2</span>
                  Fecha y Hora
                </h3>
                <input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' }}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                  {availableSlots.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>No hay espacios disponibles</div>
                  ) : availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                        border: selectedSlot === slot ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                        backgroundColor: selectedSlot === slot ? primaryColor : 'white',
                        color: selectedSlot === slot ? 'white' : '#334155'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Detalles y Envío */}
            {selectedCourt && selectedSlot && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: primaryColor, color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>3</span>
                  Detalles de la Reserva
                </h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setBookingMode('full')}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', border: bookingMode === 'full' ? `2px solid ${primaryColor}` : '1px solid #cbd5e1', backgroundColor: bookingMode === 'full' ? `${primaryColor}10` : 'white', fontWeight: 'bold', color: bookingMode === 'full' ? primaryColor : '#475569' }}
                  >
                    Reserva Completa
                  </button>
                  <button
                    onClick={() => setBookingMode('seek_match')}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', border: bookingMode === 'seek_match' ? `2px solid #d97706` : '1px solid #cbd5e1', backgroundColor: bookingMode === 'seek_match' ? `#fef3c7` : 'white', fontWeight: 'bold', color: bookingMode === 'seek_match' ? '#d97706' : '#475569' }}
                  >
                    ¡Busca Reto!
                  </button>
                </div>

                <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Tu Equipo {bookingMode === 'full' ? '(Equipo A)' : ''}</h4>
                    <input type="text" placeholder="Nombre del Equipo" required value={teamAName} onChange={e => setTeamAName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
                    <input type="text" placeholder="Nombre del Capitán" required value={teamACaptain} onChange={e => setTeamACaptain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
                    <input type="tel" placeholder="WhatsApp" required value={teamAPhone} onChange={e => setTeamAPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>

                  {bookingMode === 'full' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Equipo Rival (Equipo B)</h4>
                      <input type="text" placeholder="Nombre del Equipo (opcional)" value={teamBName} onChange={e => setTeamBName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
                      <input type="text" placeholder="Nombre del Capitán (opcional)" value={teamBCaptain} onChange={e => setTeamBCaptain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px' }} />
                      <input type="tel" placeholder="WhatsApp (opcional)" value={teamBPhone} onChange={e => setTeamBPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  )}

                  {bookingMode === 'seek_match' && (
                    <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#b45309' }}>Nivel de tu equipo</h4>
                      <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: 'white' }}>
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                        <option value="abierto">Abierto (Cualquiera)</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Jugadores extra</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>+ ₡{selectedCourt.extraPlayerFee} c/u</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button type="button" onClick={() => setExtraPlayers(Math.max(0, extraPlayers - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', width: '20px', textAlign: 'center' }}>{extraPlayers}</span>
                      <button type="button" onClick={() => setExtraPlayers(Math.min(selectedCourt.maxExtraPlayers, extraPlayers + 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', padding: '16px', backgroundColor: `${primaryColor}15`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: primaryColor, fontSize: '1.1rem' }}>Total a pagar:</div>
                    <div style={{ fontWeight: 'bold', color: primaryColor, fontSize: '1.3rem' }}>₡{calculateTotal().toLocaleString()}</div>
                  </div>

                  <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: primaryColor, color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
                    {submitting ? 'Procesando...' : 'Confirmar Reserva'}
                  </button>

                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab: Partidos Abiertos */}
        {activeTab === 'open_matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {joiningMatch ? (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <button 
                  onClick={() => setJoiningMatch(null)}
                  style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: 'bold', marginBottom: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ← Volver a lista
                </button>
                <h3 style={{ margin: '0 0 16px 0', color: '#334155' }}>Unirte al reto contra {joiningMatch.teamAName}</h3>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                  <div><strong>Cancha:</strong> {joiningMatch.courtName}</div>
                  <div><strong>Fecha:</strong> {joiningMatch.date} a las {joiningMatch.time}</div>
                  <div><strong>Nivel buscado:</strong> {joiningMatch.skillLevel}</div>
                  <div><strong>Aportación por equipo:</strong> ₡{(joiningMatch.totalPrice / 2).toLocaleString()}</div>
                </div>
                
                <form onSubmit={handleJoinMatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Nombre de tu Equipo" required value={teamBName} onChange={e => setTeamBName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="Nombre del Capitán" required value={teamBCaptain} onChange={e => setTeamBCaptain(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="tel" placeholder="Tu WhatsApp" required value={teamBPhone} onChange={e => setTeamBPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  
                  <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
                    {submitting ? 'Procesando...' : '¡Aceptar Reto!'}
                  </button>
                </form>
              </div>
            ) : (
              openMatches.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <Trophy size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>No hay retos disponibles</h3>
                  <p style={{ margin: 0 }}>Crea tu propia reserva y marca "Busca Reto" para aparecer aquí.</p>
                </div>
              ) : (
                openMatches.map(m => (
                  <div key={m.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #d97706' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: '#334155', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trophy size={18} color="#d97706" /> {m.courtName}
                      </h3>
                      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Nivel: {m.skillLevel}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#475569', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> {m.date} · {m.time}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Retador: <strong>{m.teamAName}</strong></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={16} /> ₡{(m.totalPrice / 2).toLocaleString()} por equipo</div>
                    </div>
                    
                    <button 
                      onClick={() => setJoiningMatch(m)}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      ¡Me uno al reto!
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
}
