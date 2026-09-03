import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, DollarSign, Plus, Minus, 
  MapPin, Check, ChevronRight, Clock, AlertCircle, Copy, 
  ExternalLink, Phone, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking, CourtsConfig } from '../../shared/types';
import { formatFriendlyDate, formatTime12h } from '../utils/dateFormat';

export default function CourtBookingPublic({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<'book' | 'open_matches'>('book');
  const [publicData, setPublicData] = useState<any>(null);
  
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

  // Payment Options
  const [courtPaymentMethod, setCourtPaymentMethod] = useState<'on_site' | 'sinpe' | 'sinpe_tilopay' | 'card'>('on_site');
  const [courtSinpeRef, setCourtSinpeRef] = useState('');

  // Tab 2 state
  const [openMatches, setOpenMatches] = useState<CourtBooking[]>([]);
  const [joiningMatch, setJoiningMatch] = useState<CourtBooking | null>(null);
  
  // Confirmation Modal state
  const [confirmedBooking, setConfirmedBooking] = useState<CourtBooking | null>(null);
  const [copiedResRef, setCopiedResRef] = useState(false);
  const [copiedSinpe, setCopiedSinpe] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const api = useApi();

  const fetchOpenMatches = async () => {
    try {
      const matches = await api.get(`/api/courts/public/${slug}/open-matches`);
      if (matches) setOpenMatches(matches);
    } catch (error) {
      console.error('Error fetching open matches:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [info, cData] = await Promise.all([
          api.get(`/api/courts/public/${slug}/info`),
          api.get(`/api/courts/public/${slug}/courts`)
        ]);
        
        if (info) setPublicData(info);
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
      fetchOpenMatches();
    }
  }, [activeTab, slug]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      const fetchSlots = async () => {
        try {
          const slots = await api.get(`/api/courts/public/${slug}/available-slots?courtId=${selectedCourt.id}&date=${selectedDate}`);
          const parsed = Array.isArray(slots) ? slots : (slots?.availableSlots || []);
          setAvailableSlots(parsed);
        } catch (error) {
          console.error(error);
          setAvailableSlots([]);
        }
      };
      fetchSlots();
    }
  }, [selectedCourt, selectedDate, slug]);

  const theme = publicData?.courtsConfig?.theme || {};
  const primaryColor = theme.primaryColor || publicData?.storeTheme?.primaryColor || '#16a34a';
  const accentColor = theme.accentColor || '#f59e0b';
  const pageTitle = theme.title || publicData?.storeName || 'Reservas Deportivas';
  const pageDescription = theme.description || publicData?.storeDescription || 'Reserva tu turno de cancha o encuentra rivales en línea.';
  const logoUrl = theme.logoUrl || publicData?.storeLogoUrl;
  const bannerUrl = theme.bannerUrl || publicData?.storeBannerUrl;
  const announcement = theme.announcement;
  const sinpePhone = theme.sinpePhone || publicData?.sinpePhone;
  const sinpeName = theme.sinpeName || publicData?.sinpeName;

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
        matchStatus: bookingMode === 'seek_match' ? 'open' : 'confirmed',
        teamAName,
        teamACaptain,
        teamAPhone,
        teamAExtraPlayers: extraPlayers,
        teamBName,
        teamBCaptain,
        teamBPhone,
        teamBExtraPlayers: bookingMode === 'full' ? extraPlayers : 0,
        skillLevel: bookingMode === 'seek_match' ? skillLevel : undefined,
        paymentMethod: courtPaymentMethod === 'on_site' ? 'cash' : courtPaymentMethod,
        paymentReference: courtPaymentMethod === 'sinpe' ? courtSinpeRef : null,
        returnUrl: window.location.href
      };
      
      const created = await api.post(`/api/courts/public/${slug}/book`, payload);
      
      if (created) {
        setConfirmedBooking({
          ...created,
          courtName: selectedCourt.name,
          paymentUrl: created.paymentUrl || created.paymentSession?.paymentUrl || null
        });
        fetchOpenMatches();
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
        teamBExtraPlayers: extraPlayers,
        paymentMethod: courtPaymentMethod === 'on_site' ? 'cash' : courtPaymentMethod,
        paymentReference: courtPaymentMethod === 'sinpe' ? courtSinpeRef : null,
        returnUrl: window.location.href
      };
      
      const updated = await api.post(`/api/courts/public/${slug}/join-match/${joiningMatch.id}`, payload);
      
      if (updated) {
        setConfirmedBooking({
          ...updated,
          courtName: joiningMatch.courtName,
          paymentUrl: updated.paymentUrl || updated.paymentSession?.paymentUrl || null
        });
        setJoiningMatch(null);
        fetchOpenMatches();
      }
    } catch (error) {
      alert('Error al unirse al partido.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyBookingDetails = (b: CourtBooking) => {
    const total = Number(b.totalPrice || 0);
    const perTeam = b.pricePerTeam || (total / 2);
    const friendlyDate = formatFriendlyDate(b.date);
    const friendlyTime = formatTime12h(b.time);

    let text = `Comprobante de Reserva - ${pageTitle}\n`;
    text += `Código: #RES-${b.id.substring(0, 8).toUpperCase()}\n`;
    text += `Cancha: ${b.courtName}\n`;
    text += `Fecha: ${friendlyDate} (${friendlyTime})\n`;
    text += `Equipo: ${b.teamAName} (Capitán: ${b.teamACaptain})\n`;
    if (b.teamBName) text += `Rival: ${b.teamBName} (Capitán: ${b.teamBCaptain})\n`;
    text += `Monto: ₡${total.toLocaleString()}`;
    if (b.bookingMode === 'seek_match') text += ` (₡${perTeam.toLocaleString()} por equipo)`;
    
    navigator.clipboard.writeText(text);
    setCopiedResRef(true);
    setTimeout(() => setCopiedResRef(false), 2500);
  };

  const notifyViaWhatsApp = (b: CourtBooking) => {
    const total = Number(b.totalPrice || 0);
    const phone = publicData?.tenant?.whatsappNumber || sinpePhone;
    if (!phone) return;
    
    const friendlyDate = formatFriendlyDate(b.date);
    const friendlyTime = formatTime12h(b.time);

    let text = `Hola, acabo de registrar mi reserva de cancha:\n\n`;
    text += `📋 *Código:* #RES-${b.id.substring(0, 8).toUpperCase()}\n`;
    text += `🏆 *Cancha:* ${b.courtName}\n`;
    text += `📅 *Fecha:* ${friendlyDate} (${friendlyTime})\n`;
    text += `👥 *Equipo:* ${b.teamAName} (Capitán: ${b.teamACaptain})\n`;
    if (b.bookingMode === 'seek_match') {
      text += `⚔️ *Modalidad:* Busca Reto (Nivel: ${b.skillLevel || 'Abierto'})\n`;
      text += `💰 *Aportación:* ₡${(b.pricePerTeam || (total / 2)).toLocaleString()}\n`;
    } else {
      text += `💰 *Total:* ₡${total.toLocaleString()}\n`;
    }
    
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>Cargando portal de canchas...</div>;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.backgroundColor || '#f8fafc',
      fontFamily: theme.fontFamily ? `${theme.fontFamily}, system-ui, sans-serif` : 'system-ui, sans-serif'
    }}>
      
      {/* BANNER / HEADER */}
      <div style={{ 
        backgroundColor: primaryColor, 
        backgroundImage: bannerUrl ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url(${bannerUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '36px 20px', 
        color: 'white', 
        textAlign: 'center' 
      }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ height: '65px', maxHeight: '65px', marginBottom: '12px', borderRadius: '10px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px' }} />
        )}
        <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
          {pageTitle}
        </h1>
        <p style={{ margin: 0, opacity: 0.92, fontSize: '0.95rem', maxWidth: '600px', marginInline: 'auto' }}>
          {pageDescription}
        </p>
      </div>

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '20px 16px 60px 16px' }}>
        
        {/* Announcement / Policies Banner */}
        {announcement && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
            <div>{announcement}</div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: `1.5px solid ${primaryColor}`, marginBottom: '20px', backgroundColor: 'white' }}>
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            style={{ 
              flex: 1, padding: '12px', border: 'none', 
              backgroundColor: activeTab === 'book' ? primaryColor : 'transparent', 
              color: activeTab === 'book' ? 'white' : primaryColor, 
              fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' 
            }}
          >
            Reservar Cancha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('open_matches')}
            style={{ 
              flex: 1, padding: '12px', border: 'none', 
              backgroundColor: activeTab === 'open_matches' ? primaryColor : 'transparent', 
              color: activeTab === 'open_matches' ? 'white' : primaryColor, 
              fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Trophy size={16} /> Partidos Abiertos (Retos) {openMatches.length > 0 && <span style={{ backgroundColor: '#d97706', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>{openMatches.length}</span>}
          </button>
        </div>

        {/* TAB 1: RESERVAR CANCHA */}
        {activeTab === 'book' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Step 1: Cancha */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: primaryColor, color: 'white', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.75rem', fontWeight: '800' }}>1</span>
                Elige la Cancha
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay canchas disponibles en este momento.
                  </div>
                ) : (
                  courts.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCourt(c); setSelectedSlot(''); }}
                      style={{
                        padding: '14px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                        border: selectedCourt?.id === c.id ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                        backgroundColor: selectedCourt?.id === c.id ? `${primaryColor}10` : 'white',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '1.0rem', color: '#0f172a', marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span><Users size={13} style={{ display: 'inline', verticalAlign: 'middle' }}/> {c.teamSize} vs {c.teamSize}</span>
                        <span><Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }}/> {c.durationMinutes} min</span>
                        <span style={{ fontWeight: '800', color: primaryColor }}>₡{Number(c.basePrice).toLocaleString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Fecha y Hora */}
            {selectedCourt && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: primaryColor, color: 'white', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
                  Fecha y Hora
                </h3>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Fecha seleccionada: <span style={{ color: primaryColor, fontWeight: '800' }}>{formatFriendlyDate(selectedDate)}</span>
                  </label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '8px' }}>
                  {availableSlots.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '14px 0' }}>
                      No hay espacios disponibles para esta fecha
                    </div>
                  ) : availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 6px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.82rem',
                        border: selectedSlot === slot ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                        backgroundColor: selectedSlot === slot ? primaryColor : 'white',
                        color: selectedSlot === slot ? 'white' : '#334155',
                        textAlign: 'center'
                      }}
                    >
                      {formatTime12h(slot)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Detalles y Reserva */}
            {selectedCourt && selectedSlot && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: primaryColor, color: 'white', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.75rem', fontWeight: '800' }}>3</span>
                  Detalles de la Reserva
                </h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingMode('full')}
                    style={{ 
                      flex: 1, padding: '12px 8px', borderRadius: '8px', cursor: 'pointer', 
                      border: bookingMode === 'full' ? `2px solid ${primaryColor}` : '1px solid #cbd5e1', 
                      backgroundColor: bookingMode === 'full' ? `${primaryColor}10` : 'white', 
                      fontWeight: '800', fontSize: '0.85rem',
                      color: bookingMode === 'full' ? primaryColor : '#475569' 
                    }}
                  >
                    Reserva Completa (2 Eq.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode('seek_match')}
                    style={{ 
                      flex: 1, padding: '12px 8px', borderRadius: '8px', cursor: 'pointer', 
                      border: bookingMode === 'seek_match' ? `2px solid ${accentColor}` : '1px solid #cbd5e1', 
                      backgroundColor: bookingMode === 'seek_match' ? `#fef3c7` : 'white', 
                      fontWeight: '800', fontSize: '0.85rem',
                      color: bookingMode === 'seek_match' ? '#b45309' : '#475569' 
                    }}
                  >
                    ¡Busca Reto! (Dividir pago)
                  </button>
                </div>

                <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Equipo A */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Tu Equipo {bookingMode === 'full' ? '(Equipo A)' : ''}
                    </div>
                    <input type="text" placeholder="Nombre del Equipo" required value={teamAName} onChange={e => setTeamAName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Nombre del Capitán" required value={teamACaptain} onChange={e => setTeamACaptain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }} />
                    <input type="tel" placeholder="WhatsApp del Capitán (Ej: 8888-8888)" required value={teamAPhone} onChange={e => setTeamAPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>

                  {bookingMode === 'full' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Equipo Rival (Equipo B - Opcional)
                      </div>
                      <input type="text" placeholder="Nombre del Equipo Rival" value={teamBName} onChange={e => setTeamBName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }} />
                      <input type="text" placeholder="Nombre del Capitán Rival" value={teamBCaptain} onChange={e => setTeamBCaptain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }} />
                      <input type="tel" placeholder="WhatsApp del Capitán Rival" value={teamBPhone} onChange={e => setTeamBPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                  )}

                  {bookingMode === 'seek_match' && (
                    <div style={{ backgroundColor: '#fffbeb', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#b45309', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Nivel de tu equipo
                      </div>
                      <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d', backgroundColor: 'white', fontWeight: '700' }}>
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                        <option value="abierto">Abierto (Cualquiera)</option>
                      </select>
                    </div>
                  )}

                  {/* Extra players */}
                  {selectedCourt.maxExtraPlayers > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Jugadores adicionales</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>+ ₡{selectedCourt.extraPlayerFee} c/u</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" onClick={() => setExtraPlayers(Math.max(0, extraPlayers - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontWeight: '800', fontSize: '1.05rem', width: '20px', textAlign: 'center' }}>{extraPlayers}</span>
                        <button type="button" onClick={() => setExtraPlayers(Math.min(selectedCourt.maxExtraPlayers, extraPlayers + 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                  )}

                  {/* Summary Total */}
                  <div style={{ padding: '14px', backgroundColor: `${primaryColor}15`, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: primaryColor, fontSize: '0.95rem' }}>Total a pagar:</div>
                      {bookingMode === 'seek_match' && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tu equipo paga el 50% (₡{(calculateTotal() / 2).toLocaleString()})</div>
                      )}
                    </div>
                    <div style={{ fontWeight: '800', color: primaryColor, fontSize: '1.3rem' }}>
                      ₡{(bookingMode === 'seek_match' ? calculateTotal() / 2 : calculateTotal()).toLocaleString()}
                    </div>
                  </div>

                  {/* Selector de Método de Pago */}
                  <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>
                      Método de Pago
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setCourtPaymentMethod('on_site')}
                        style={{
                          padding: '10px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'on_site' ? primaryColor : '#e2e8f0'}`,
                          backgroundColor: courtPaymentMethod === 'on_site' ? `${primaryColor}15` : 'white',
                          cursor: 'pointer', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700'
                        }}
                      >
                        💵 En Cancha
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>Pagar al llegar</span>
                      </button>

                      {publicData?.paymentSettings?.acceptSinpe && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('sinpe')}
                          style={{
                            padding: '10px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'sinpe' ? primaryColor : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'sinpe' ? `${primaryColor}15` : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700'
                          }}
                        >
                          📱 SINPE Móvil
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>Manual</span>
                        </button>
                      )}

                      {publicData?.paymentSettings?.acceptSinpeTilopay && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('sinpe_tilopay')}
                          style={{
                            padding: '10px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'sinpe_tilopay' ? '#059669' : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'sinpe_tilopay' ? '#ecfdf5' : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700'
                          }}
                        >
                          ⚡ SINPE Auto
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#047857', fontWeight: 'normal' }}>Verificado</span>
                        </button>
                      )}

                      {publicData?.paymentSettings?.acceptCard && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('card')}
                          style={{
                            padding: '10px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'card' ? '#2563eb' : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'card' ? '#eff6ff' : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700'
                          }}
                        >
                          💳 Tarjeta
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 'normal' }}>Débito / Crédito</span>
                        </button>
                      )}
                    </div>

                    {courtPaymentMethod === 'sinpe' && (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.82rem', color: '#166534', marginBottom: '10px' }}>
                        <div>• SINPE: <strong>{publicData?.paymentSettings?.sinpePhone || publicData?.sinpePhone}</strong> ({publicData?.paymentSettings?.sinpeName || publicData?.sinpeName})</div>
                        <input
                          type="text"
                          placeholder="Número de comprobante (opcional)"
                          value={courtSinpeRef}
                          onChange={e => setCourtSinpeRef(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #86efac', marginTop: '6px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                    {(courtPaymentMethod === 'card' || courtPaymentMethod === 'sinpe_tilopay') && (
                      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#1e40af', marginBottom: '10px' }}>
                        🔒 Al confirmar, podrás realizar el pago de inmediato y de forma segura mediante Tilopay.
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    style={{ 
                      width: '100%', padding: '14px', borderRadius: '10px', border: 'none', 
                      backgroundColor: primaryColor, color: 'white', fontWeight: '800', fontSize: '1.05rem', 
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }}
                  >
                    {submitting ? 'Registrando Reserva...' : 'Confirmar Reserva'}
                  </button>

                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PARTIDOS ABIERTOS (RETOS) */}
        {activeTab === 'open_matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {joiningMatch ? (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <button 
                  type="button"
                  onClick={() => setJoiningMatch(null)}
                  style={{ background: 'none', border: 'none', color: primaryColor, fontWeight: '800', marginBottom: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                >
                  ← Volver a lista de retos
                </button>

                <h3 style={{ margin: '0 0 14px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '800' }}>
                  Unirte al reto contra {joiningMatch.teamAName}
                </h3>
                
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div><strong>Cancha:</strong> {joiningMatch.courtName}</div>
                  <div><strong>Fecha:</strong> {formatFriendlyDate(joiningMatch.date)}</div>
                  <div><strong>Hora:</strong> {formatTime12h(joiningMatch.time)} ({joiningMatch.durationMinutes || 60} min)</div>
                  <div><strong>Nivel buscado:</strong> {joiningMatch.skillLevel || 'Abierto'}</div>
                  <div><strong>Aportación de tu equipo:</strong> ₡{(joiningMatch.totalPrice / 2).toLocaleString()}</div>
                </div>
                
                <form onSubmit={handleJoinMatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Nombre de tu Equipo" required value={teamBName} onChange={e => setTeamBName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Nombre del Capitán" required value={teamBCaptain} onChange={e => setTeamBCaptain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  <input type="tel" placeholder="Tu WhatsApp (Ej: 8888-8888)" required value={teamBPhone} onChange={e => setTeamBPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  
                  {/* Selector de Método de Pago para Equipo B */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>
                      Método de Pago para tu cuota (50%)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setCourtPaymentMethod('on_site')}
                        style={{
                          padding: '8px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'on_site' ? '#d97706' : '#e2e8f0'}`,
                          backgroundColor: courtPaymentMethod === 'on_site' ? '#fef3c7' : 'white',
                          cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700'
                        }}
                      >
                        💵 En Cancha
                      </button>

                      {publicData?.paymentSettings?.acceptSinpe && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('sinpe')}
                          style={{
                            padding: '8px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'sinpe' ? '#d97706' : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'sinpe' ? '#fef3c7' : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700'
                          }}
                        >
                          📱 SINPE
                        </button>
                      )}

                      {publicData?.paymentSettings?.acceptSinpeTilopay && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('sinpe_tilopay')}
                          style={{
                            padding: '8px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'sinpe_tilopay' ? '#059669' : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'sinpe_tilopay' ? '#ecfdf5' : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700'
                          }}
                        >
                          ⚡ SINPE Auto
                        </button>
                      )}

                      {publicData?.paymentSettings?.acceptCard && (
                        <button
                          type="button"
                          onClick={() => setCourtPaymentMethod('card')}
                          style={{
                            padding: '8px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'card' ? '#2563eb' : '#e2e8f0'}`,
                            backgroundColor: courtPaymentMethod === 'card' ? '#eff6ff' : 'white',
                            cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700'
                          }}
                        >
                          💳 Tarjeta
                        </button>
                      )}
                    </div>

                    {courtPaymentMethod === 'sinpe' && (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', color: '#166534', marginBottom: '8px' }}>
                        <div>• SINPE: <strong>{publicData?.paymentSettings?.sinpePhone || publicData?.sinpePhone}</strong> ({publicData?.paymentSettings?.sinpeName || publicData?.sinpeName})</div>
                        <input
                          type="text"
                          placeholder="Número de comprobante (opcional)"
                          value={courtSinpeRef}
                          onChange={e => setCourtSinpeRef(e.target.value)}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #86efac', marginTop: '4px', fontSize: '0.78rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                    {(courtPaymentMethod === 'card' || courtPaymentMethod === 'sinpe_tilopay') && (
                      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', color: '#1e40af', marginBottom: '8px' }}>
                        🔒 Al confirmar, podrás pagar tu cuota con verificación inmediata mediante Tilopay.
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: 'white', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', marginTop: '6px' }}>
                    {submitting ? 'Procesando...' : '¡Aceptar Reto y Jugar!'}
                  </button>
                </form>
              </div>
            ) : (
              openMatches.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '14px', textAlign: 'center', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                  <Trophy size={44} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                  <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: '800' }}>No hay retos disponibles</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Crea tu propia reserva y marca "¡Busca Reto!" para aparecer aquí y dividir el costo.</p>
                </div>
              ) : (
                openMatches.map(m => (
                  <div key={m.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '5px solid #d97706', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trophy size={18} color="#d97706" /> {m.courtName}
                      </h3>
                      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800' }}>Nivel: {m.skillLevel || 'Abierto'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> <strong>{formatFriendlyDate(m.date)}</strong> · {formatTime12h(m.time)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14} /> Retador: <strong>{m.teamAName}</strong> (Capitán: {m.teamACaptain})</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={14} /> ₡{(m.totalPrice / 2).toLocaleString()} por equipo</div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setJoiningMatch(m)}
                      style={{ width: '100%', padding: '11px', backgroundColor: '#fffbeb', color: '#d97706', border: '1.5px solid #fcd34d', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}
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

      {/* CONFIRMATION MODAL WITH RESERVATION NUMBER & PAYMENT INSTRUCTIONS */}
      {confirmedBooking && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '18px', maxWidth: '480px', width: '100%',
            padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7',
              color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
              {confirmedBooking.bookingMode === 'seek_match' && !confirmedBooking.teamBName 
                ? '¡Reto Publicado con Éxito!' 
                : '¡Reserva Registrada con Éxito!'}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Guarda tu número de reserva para identificarte en el complejo deportivo.
            </p>

            {/* Reference Number Card */}
            <div style={{
              backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px',
              padding: '12px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Número de Reserva Oficial
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: primaryColor, letterSpacing: '0.04em', margin: '4px 0' }}>
                #RES-{confirmedBooking.id.substring(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Summary Details */}
            <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Cancha:</strong> {confirmedBooking.courtName}</div>
              <div><strong>Fecha:</strong> {formatFriendlyDate(confirmedBooking.date)}</div>
              <div><strong>Hora:</strong> {formatTime12h(confirmedBooking.time)}</div>
              <div><strong>Equipo:</strong> {confirmedBooking.teamAName} {confirmedBooking.teamBName ? `vs ${confirmedBooking.teamBName}` : ''}</div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Monto a pagar:</strong>
                <strong style={{ color: primaryColor, fontSize: '0.95rem' }}>
                  ₡{(confirmedBooking.bookingMode === 'seek_match' && !confirmedBooking.teamBName ? confirmedBooking.totalPrice / 2 : confirmedBooking.totalPrice).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Online Payment Button with Tilopay if generated */}
            {(confirmedBooking as any).paymentUrl && (
              <div style={{
                textAlign: 'left', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '800', color: '#166534', marginBottom: '4px', fontSize: '0.9rem' }}>
                  💳 Pago en Línea Disponible
                </div>
                <div style={{ fontSize: '0.8rem', color: '#15803d', marginBottom: '10px' }}>
                  Asegura tu cancha de inmediato completando tu transacción segura con Tilopay (SINPE Móvil o Tarjeta):
                </div>
                <a
                  href={(confirmedBooking as any).paymentUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    width: '100%', padding: '12px', backgroundColor: '#059669', color: 'white',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: '800', fontSize: '0.9rem',
                    boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  ⚡ Pagar Reserva con Tilopay
                </a>
              </div>
            )}

            {/* SINPE Payment Card if configured */}
            {sinpePhone && (
              <div style={{
                textAlign: 'left', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.82rem', color: '#065f46'
              }}>
                <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Pago por SINPE Móvil:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sinpePhone);
                      setCopiedSinpe(true);
                      setTimeout(() => setCopiedSinpe(false), 2000);
                    }}
                    style={{
                      border: 'none', background: '#059669', color: 'white', padding: '2px 8px',
                      borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    {copiedSinpe ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div>Teléfono: <strong>{sinpePhone}</strong></div>
                {sinpeName && <div>A nombre de: <strong>{sinpeName}</strong></div>}
                <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '4px' }}>
                  Detalle: #RES-{confirmedBooking.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => copyBookingDetails(confirmedBooking)}
                style={{
                  padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  backgroundColor: 'white', color: '#0f172a', fontWeight: '700', fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Copy size={15} />
                {copiedResRef ? '¡Detalles Copiados!' : 'Copiar Resumen de Reserva'}
              </button>

              <button
                type="button"
                onClick={() => notifyViaWhatsApp(confirmedBooking)}
                style={{
                  padding: '10px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#16a34a', color: 'white', fontWeight: '800', fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Phone size={15} />
                Notificar por WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  window.location.reload();
                }}
                style={{
                  padding: '10px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', fontSize: '0.85rem',
                  cursor: 'pointer', marginTop: '4px'
                }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
