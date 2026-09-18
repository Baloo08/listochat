import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, DollarSign, Plus, Minus, 
  MapPin, Check, ChevronRight, Clock, AlertCircle, Copy, 
  ExternalLink, Phone, ShieldCheck, CheckCircle2, Search
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking, CourtsConfig } from '../../shared/types';
import { formatFriendlyDate, formatTime12h } from '../utils/dateFormat';
import { resolveImageUrl } from '../../shared/imageHelper';

export default function CourtBookingPublic({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState<'book' | 'open_matches' | 'manage'>('book');
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
  const [courtPaymentMethod, setCourtPaymentMethod] = useState<'on_site' | 'sinpe' | 'sinpe_tilopay' | 'card' | 'solo_reserva'>('on_site');
  const [courtSinpeRef, setCourtSinpeRef] = useState('');

  // Electronic Billing States (Costa Rica DGT - Almendro)
  const [almendroConfig, setAlmendroConfig] = useState<{ isEnabled: boolean; defaultDocType?: string } | null>(null);
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [taxIdType, setTaxIdType] = useState('01');
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [taxLegalName, setTaxLegalName] = useState('');
  const [taxEmail, setTaxEmail] = useState('');

  // Tab 2 state
  const [openMatches, setOpenMatches] = useState<CourtBooking[]>([]);
  const [joiningMatch, setJoiningMatch] = useState<CourtBooking | null>(null);
  
  // Tab 3 state: Consultar / Modificar Reserva (manage)
  const [searchCode, setSearchCode] = useState('');
  const [searchingBooking, setSearchingBooking] = useState(false);
  const [managedBooking, setManagedBooking] = useState<CourtBooking | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isEditingReschedule, setIsEditingReschedule] = useState(false);
  const [rescheduleCourtId, setRescheduleCourtId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);
  const [copiedManageCode, setCopiedManageCode] = useState(false);

  // Confirmation Modal state
  const [confirmedBooking, setConfirmedBooking] = useState<CourtBooking | null>(null);
  const [copiedResRef, setCopiedResRef] = useState(false);
  const [copiedSinpe, setCopiedSinpe] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

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
        
        if (info) {
          setPublicData(info);
          if (info?.businessName) {
            document.title = `Reserva de Canchas Deportivas | ${info.businessName}`;
          }
        }
        if (cData) setCourts(cData);

        // Fetch Almendro public configuration for courts
        fetch(`/api/almendro/public-config/${slug}?module=courts`)
          .then(r => r.json())
          .then(cfg => {
            if (cfg?.isEnabled) setAlmendroConfig(cfg);
          })
          .catch(() => {});
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

  // Fetch available slots for public reschedule
  useEffect(() => {
    if (isEditingReschedule && rescheduleCourtId && rescheduleDate) {
      const fetchSlots = async () => {
        try {
          const slots = await api.get(`/api/courts/public/${slug}/available-slots?courtId=${rescheduleCourtId}&date=${rescheduleDate}`);
          const parsed = Array.isArray(slots) ? slots : (slots?.availableSlots || []);
          if (managedBooking && rescheduleCourtId === managedBooking.courtId && rescheduleDate === managedBooking.date) {
            if (!parsed.includes(managedBooking.time)) {
              parsed.push(managedBooking.time);
              parsed.sort();
            }
          }
          setRescheduleSlots(parsed);
          if (parsed.length > 0 && !rescheduleTime) {
            setRescheduleTime(parsed[0]);
          }
        } catch (e) {
          setRescheduleSlots([]);
        }
      };
      fetchSlots();
    }
  }, [isEditingReschedule, rescheduleCourtId, rescheduleDate, slug]);

  const theme = publicData?.courtsConfig?.theme || {};
  const primaryColor = theme.primaryColor || publicData?.storeTheme?.primaryColor || '#16a34a';
  const accentColor = theme.accentColor || '#f59e0b';
  const pageTitle = theme.title || publicData?.storeName || 'Reservas Deportivas';
  const pageDescription = theme.description || publicData?.storeDescription || 'Reserva tu turno de cancha o encuentra rivales en línea.';
  const rawLogoUrl = theme.logoUrl || publicData?.storeLogoUrl;
  const rawBannerUrl = theme.bannerUrl || publicData?.storeBannerUrl;
  const logoUrl = !logoError && rawLogoUrl ? resolveImageUrl(rawLogoUrl) : null;
  const bannerUrl = !bannerError && rawBannerUrl ? resolveImageUrl(rawBannerUrl) : null;
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

    if (requiresInvoice) {
      if (!taxIdNumber.trim() || !taxLegalName.trim() || !taxEmail.trim()) {
        alert('Por favor completa todos los datos de facturación electrónica (Cédula, Nombre/Razón Social y Correo).');
        return;
      }
    }
    
    setSubmitting(true);
    try {
      const resolvedPaymentMethod = courtPaymentMethod === 'on_site' ? 'cash' : courtPaymentMethod;
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
        paymentMethod: resolvedPaymentMethod,
        paymentReference: courtPaymentMethod === 'sinpe' ? courtSinpeRef : null,
        returnUrl: window.location.href,
        billingInfo: requiresInvoice ? {
          requiresInvoice: true,
          idType: taxIdType,
          idNumber: taxIdNumber.trim(),
          legalName: taxLegalName.trim(),
          email: taxEmail.trim()
        } : { requiresInvoice: false }
      };
      
      const created = await api.post(`/api/courts/public/${slug}/book`, payload);
      
      if (created) {
        const paymentUrl = created.paymentUrl || created.paymentSession?.paymentUrl || null;
        // Auto-redirect to Tilopay for online payments
        if (paymentUrl && (resolvedPaymentMethod === 'card' || resolvedPaymentMethod === 'sinpe_tilopay')) {
          window.location.href = paymentUrl;
          return;
        }
        setConfirmedBooking({
          ...created,
          courtName: selectedCourt.name,
          paymentUrl
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
      const resolvedPaymentMethod = courtPaymentMethod === 'on_site' ? 'cash' : courtPaymentMethod;
      const payload = {
        teamBName,
        teamBCaptain,
        teamBPhone,
        teamBExtraPlayers: extraPlayers,
        paymentMethod: resolvedPaymentMethod,
        paymentReference: courtPaymentMethod === 'sinpe' ? courtSinpeRef : null,
        returnUrl: window.location.href
      };
      
      const updated = await api.post(`/api/courts/public/${slug}/join-match/${joiningMatch.id}`, payload);
      
      if (updated) {
        const paymentUrl = updated.paymentUrl || updated.paymentSession?.paymentUrl || null;
        // Auto-redirect to Tilopay for online payments
        if (paymentUrl && (resolvedPaymentMethod === 'card' || resolvedPaymentMethod === 'sinpe_tilopay')) {
          window.location.href = paymentUrl;
          return;
        }
        setConfirmedBooking({
          ...updated,
          courtName: joiningMatch.courtName,
          paymentUrl
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
    const code = b.bookingCode || `#RES-${b.id.substring(0, 8).toUpperCase()}`;

    let text = `Comprobante de Reserva - ${pageTitle}\n`;
    text += `Código: ${code}\n`;
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
    const code = b.bookingCode || `#RES-${b.id.substring(0, 8).toUpperCase()}`;

    let text = `Hola, acabo de registrar mi reserva de cancha:\n\n`;
    text += `📋 *Código:* ${code}\n`;
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

  const handleSearchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchCode.trim();
    if (!code) return;

    setSearchingBooking(true);
    setSearchError('');
    setRescheduleSuccess(null);
    setIsEditingReschedule(false);
    try {
      const b = await api.get(`/api/courts/public/${slug}/booking-by-code?code=${encodeURIComponent(code)}`);
      if (b && b.id) {
        setManagedBooking(b);
        setRescheduleCourtId(b.courtId);
        setRescheduleDate(b.date);
        setRescheduleTime(b.time);
      } else {
        setSearchError('No encontramos ninguna reserva con ese código. Verifica el código e intenta de nuevo.');
        setManagedBooking(null);
      }
    } catch (err: any) {
      setSearchError(err.message || 'No se encontró la reserva con ese código.');
      setManagedBooking(null);
    } finally {
      setSearchingBooking(false);
    }
  };

  const canReschedulePublicly = (b: CourtBooking) => {
    if (b.status === 'cancelled') return false;
    if (publicData?.courtsConfig?.allowPublicReschedule === false) return false;
    const minHours = publicData?.courtsConfig?.minRescheduleHoursBefore ?? 2;
    try {
      const [year, month, day] = b.date.split('-').map(Number);
      const [hours, minutes] = b.time.split(':').map(Number);
      const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
      const diffHours = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      return diffHours >= minHours;
    } catch {
      return true;
    }
  };

  const handlePublicReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedBooking || !rescheduleCourtId || !rescheduleDate || !rescheduleTime) {
      alert('Por favor selecciona la cancha, fecha y horario.');
      return;
    }

    setRescheduling(true);
    setSearchError('');
    try {
      const res = await api.post(`/api/courts/public/${slug}/reschedule`, {
        bookingCode: managedBooking.bookingCode || managedBooking.id,
        newCourtId: rescheduleCourtId,
        newDate: rescheduleDate,
        newTime: rescheduleTime,
        reason: rescheduleReason
      });

      if (res && res.id) {
        setManagedBooking(res);
        setIsEditingReschedule(false);
        setRescheduleSuccess('✅ ¡Tu reserva fue reagendada con éxito! Te hemos enviado la confirmación actualizada por WhatsApp.');
      }
    } catch (err: any) {
      alert(err.message || 'Error al reagendar reserva');
    } finally {
      setRescheduling(false);
    }
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
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo" 
            onError={() => setLogoError(true)} 
            style={{ height: '65px', maxHeight: '65px', marginBottom: '12px', borderRadius: '10px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px' }} 
          />
        ) : (
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            fontSize: '1.4rem',
            fontWeight: '800',
            color: 'white',
            backdropFilter: 'blur(4px)'
          }}>
            {pageTitle?.charAt(0)?.toUpperCase() || '⚽'}
          </div>
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
              flex: 1, padding: '12px 6px', border: 'none', 
              backgroundColor: activeTab === 'book' ? primaryColor : 'transparent', 
              color: activeTab === 'book' ? 'white' : primaryColor, 
              fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' 
            }}
          >
            Reservar Cancha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('open_matches')}
            style={{ 
              flex: 1, padding: '12px 6px', border: 'none', 
              backgroundColor: activeTab === 'open_matches' ? primaryColor : 'transparent', 
              color: activeTab === 'open_matches' ? 'white' : primaryColor, 
              fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}
          >
            <Trophy size={15} /> Retos {openMatches.length > 0 && <span style={{ backgroundColor: '#d97706', color: 'white', padding: '1px 5px', borderRadius: '10px', fontSize: '0.7rem' }}>{openMatches.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            style={{ 
              flex: 1, padding: '12px 6px', border: 'none', 
              backgroundColor: activeTab === 'manage' ? primaryColor : 'transparent', 
              color: activeTab === 'manage' ? 'white' : primaryColor, 
              fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}
          >
            <Clock size={15} /> Mi Reserva
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
                        padding: '12px 14px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                        border: selectedCourt?.id === c.id ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                        backgroundColor: selectedCourt?.id === c.id ? `${primaryColor}10` : 'white',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px'
                      }}
                    >
                      {c.imageUrl ? (
                        <img
                          src={resolveImageUrl(c.imageUrl)}
                          alt={c.name}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '8px',
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: '800',
                          fontSize: '1.3rem'
                        }}>
                          ⚽
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '1.0rem', color: '#0f172a', marginBottom: '4px' }}>{c.name}</div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                          <span><Users size={13} style={{ display: 'inline', verticalAlign: 'middle' }}/> {c.teamSize} vs {c.teamSize}</span>
                          <span><Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }}/> {c.durationMinutes} min</span>
                          <span style={{ fontWeight: '800', color: primaryColor }}>₡{Number(c.basePrice).toLocaleString()}</span>
                        </div>
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
                  {(() => {
                    const pm = publicData?.paymentSettings?.paymentMode || 'both';
                    // In solo_reserva mode: skip payment selection entirely
                    if (pm === 'solo_reserva') return null;
                    // In on_site mode: no selector, cash is implicit
                    if (pm === 'on_site') return null;
                    return (
                      <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>
                          Método de Pago
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                          {/* Solo Reservar — always visible */}
                          <button
                            type="button"
                            onClick={() => setCourtPaymentMethod('solo_reserva')}
                            style={{
                              padding: '10px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'solo_reserva' ? '#7c3aed' : '#e2e8f0'}`,
                              backgroundColor: courtPaymentMethod === 'solo_reserva' ? '#f5f3ff' : 'white',
                              cursor: 'pointer', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700'
                            }}
                          >
                            🏷️ Solo Reservar
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#6d28d9', fontWeight: 'normal' }}>Sin cobro ahora</span>
                          </button>

                          {/* En Cancha — visible in both/on_site */}
                          {pm !== 'online' && (
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
                          )}

                          {/* SINPE Manual */}
                          {publicData?.paymentSettings?.acceptSinpe && pm !== 'on_site' && (
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

                          {/* SINPE Tilopay */}
                          {publicData?.paymentSettings?.acceptSinpeTilopay && pm !== 'on_site' && (
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
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#047857', fontWeight: 'normal' }}>Tilopay</span>
                            </button>
                          )}

                          {/* Tarjeta Tilopay */}
                          {publicData?.paymentSettings?.acceptCard && pm !== 'on_site' && (
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
                        {courtPaymentMethod === 'sinpe_tilopay' && (
                          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#065f46', marginBottom: '10px' }}>
                            ⚡ <strong>¿Cómo funciona SINPE Auto?</strong> Al confirmar, se abrirá la pasarela segura de Tilopay. Dentro de la pasarela, selecciona la pestaña <strong>SINPE Móvil</strong> para pagar con tu número. <em>Requiere que tu banco tenga habilitado el cobro SINPE desde Tilopay.</em>
                          </div>
                        )}
                        {(courtPaymentMethod === 'card' || courtPaymentMethod === 'sinpe_tilopay') && (
                          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#1e40af', marginBottom: '10px' }}>
                            🔒 Al confirmar serás redirigido automáticamente a Tilopay para completar el pago de forma segura.
                          </div>
                        )}
                        {courtPaymentMethod === 'solo_reserva' && (
                          <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#4c1d95', marginBottom: '10px' }}>
                            🏷️ Tu reserva quedará registrada sin cargo. El negocio coordinará el pago contigo directamente.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Facturación Electrónica Costa Rica (Almendro / Hacienda) */}
                  {almendroConfig?.isEnabled && (
                    <div style={{ marginTop: '4px', marginBottom: '10px', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', color: '#1e293b' }}>
                        <input
                          type="checkbox"
                          checked={requiresInvoice}
                          onChange={(e) => setRequiresInvoice(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: primaryColor }}
                        />
                        <span>¿Necesita Factura Electrónica? (Hacienda CR)</span>
                      </label>

                      {requiresInvoice && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                                Tipo Cédula *
                              </label>
                              <select
                                value={taxIdType}
                                onChange={(e) => setTaxIdType(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                              >
                                <option value="01">Física (01)</option>
                                <option value="02">Jurídica (02)</option>
                                <option value="03">DIMEX (03)</option>
                                <option value="04">NITE (04)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                                Número de Cédula *
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: 101110222"
                                value={taxIdNumber}
                                onChange={(e) => setTaxIdNumber(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                              Nombre o Razón Social *
                            </label>
                            <input
                              type="text"
                              placeholder="Nombre completo o Empresa registrada en Hacienda"
                              value={taxLegalName}
                              onChange={(e) => setTaxLegalName(e.target.value)}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                              Correo para Envío de Factura (XML + PDF) *
                            </label>
                            <input
                              type="email"
                              placeholder="tufactura@ejemplo.com"
                              value={taxEmail}
                              onChange={(e) => setTaxEmail(e.target.value)}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    style={{ 
                      width: '100%', padding: '14px', borderRadius: '10px', border: 'none', 
                      backgroundColor: primaryColor, color: 'white', fontWeight: '800', fontSize: '1.05rem', 
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }}
                  >
                    {submitting ? 'Registrando Reserva...' : courtPaymentMethod === 'solo_reserva' ? '🏷️ Reservar Sin Pago' : 'Confirmar Reserva'}
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
                  {(() => {
                    const pm = publicData?.paymentSettings?.paymentMode || 'both';
                    if (pm === 'solo_reserva' || pm === 'on_site') return null;
                    return (
                      <div style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>
                          Método de Pago para tu cuota (50%)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setCourtPaymentMethod('solo_reserva')}
                            style={{
                              padding: '8px', borderRadius: '8px', border: `2px solid ${courtPaymentMethod === 'solo_reserva' ? '#7c3aed' : '#e2e8f0'}`,
                              backgroundColor: courtPaymentMethod === 'solo_reserva' ? '#f5f3ff' : 'white',
                              cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700'
                            }}
                          >
                            🏷️ Solo Reservar
                          </button>

                          {pm !== 'online' && (
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
                          )}

                          {publicData?.paymentSettings?.acceptSinpe && pm !== 'on_site' && (
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

                          {publicData?.paymentSettings?.acceptSinpeTilopay && pm !== 'on_site' && (
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

                          {publicData?.paymentSettings?.acceptCard && pm !== 'on_site' && (
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
                        {courtPaymentMethod === 'sinpe_tilopay' && (
                          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', color: '#065f46', marginBottom: '8px' }}>
                            ⚡ Al confirmar se abrirá Tilopay. Selecciona la pestaña <strong>SINPE Móvil</strong> dentro de la pasarela.
                          </div>
                        )}
                        {(courtPaymentMethod === 'card' || courtPaymentMethod === 'sinpe_tilopay') && (
                          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', color: '#1e40af', marginBottom: '8px' }}>
                            🔒 Serás redirigido a Tilopay para completar el pago de forma segura.
                          </div>
                        )}
                        {courtPaymentMethod === 'solo_reserva' && (
                          <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', color: '#4c1d95', marginBottom: '8px' }}>
                            🏷️ Tu lugar quedará reservado sin cargo inmediato.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: 'white', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', marginTop: '6px' }}>
                    {submitting ? 'Procesando...' : courtPaymentMethod === 'solo_reserva' ? '🏷️ Reservar Sin Pago' : '¡Aceptar Reto y Jugar!'}
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

        {/* TAB 3: CONSULTAR Y REAGENDAR RESERVA */}
        {activeTab === 'manage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Box */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} color={primaryColor} />
                Consultar o Reagendar tu Reserva
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
                Ingresa tu código de reserva (ej. <strong>CRT-A8F2K1</strong> o <strong>#RES-A8F2K1</strong>) que recibiste al reservar o por WhatsApp.
              </p>

              <form onSubmit={handleSearchBooking} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Ej: CRT-A8F2K1"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  style={{
                    flex: '1 1 200px', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.04em', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  disabled={searchingBooking || !searchCode.trim()}
                  style={{
                    padding: '11px 20px', borderRadius: '8px', border: 'none', backgroundColor: primaryColor,
                    color: 'white', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
                    opacity: (!searchCode.trim() || searchingBooking) ? 0.6 : 1
                  }}
                >
                  {searchingBooking ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              {searchError && (
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{searchError}</span>
                </div>
              )}

              {rescheduleSuccess && (
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{rescheduleSuccess}</span>
                </div>
              )}
            </div>

            {/* Booking Details View */}
            {managedBooking && (
              <div style={{ backgroundColor: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                      {managedBooking.courtName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: primaryColor, backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                        {managedBooking.bookingCode || `CRT-${managedBooking.id.substring(0, 8).toUpperCase()}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(managedBooking.bookingCode || `CRT-${managedBooking.id.substring(0, 8).toUpperCase()}`);
                          setCopiedManageCode(true);
                          setTimeout(() => setCopiedManageCode(false), 2000);
                        }}
                        style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Copiar código"
                      >
                        <Copy size={14} />
                        {copiedManageCode && <span style={{ fontSize: '0.72rem', color: '#16a34a', marginLeft: '4px' }}>¡Copiado!</span>}
                      </button>
                    </div>
                  </div>

                  <div>
                    {managedBooking.status === 'confirmed' && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>Confirmada</span>}
                    {managedBooking.status === 'pending' && <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>Pendiente de Pago</span>}
                    {managedBooking.status === 'cancelled' && <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>Cancelada</span>}
                    {managedBooking.status === 'uncompleted' && <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>No Concretada</span>}
                  </div>
                </div>

                {/* Match summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.88rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Fecha y Hora</div>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {formatFriendlyDate(managedBooking.date)} · {formatTime12h(managedBooking.time)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Equipos</div>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {managedBooking.teamAName} {managedBooking.teamBName ? `vs ${managedBooking.teamBName}` : ''}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Monto Total</div>
                    <div style={{ fontWeight: '800', color: primaryColor, marginTop: '2px', fontSize: '1.05rem' }}>
                      ₡{Number(managedBooking.totalPrice).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Estado de Pago</div>
                    <div style={{ fontWeight: '700', marginTop: '2px', color: managedBooking.teamAPaid ? '#15803d' : '#ea580c' }}>
                      {managedBooking.teamAPaid ? '✅ Confirmado' : '⏳ Pendiente de pago'}
                    </div>
                  </div>
                </div>

                {/* Reschedule Management Form or Action */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  {managedBooking.status === 'cancelled' ? (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '10px' }}>
                      Esta reserva ha sido cancelada y no puede ser reagendada.
                    </div>
                  ) : !canReschedulePublicly(managedBooking) ? (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', fontSize: '0.85rem', color: '#92400e' }}>
                      <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> Reagendamiento Web No Disponible
                      </div>
                      <p style={{ margin: '0 0 10px 0' }}>
                        Por políticas del establecimiento, los turnos solo pueden modificarse por la web con al menos {publicData?.courtsConfig?.minRescheduleHoursBefore ?? 2} horas de anticipación.
                      </p>
                      {publicData?.tenant?.whatsappNumber && (
                        <a
                          href={`https://wa.me/${publicData.tenant.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, necesito solicitar un cambio para mi reserva ${managedBooking.bookingCode || managedBooking.id}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                            backgroundColor: '#16a34a', color: 'white', borderRadius: '6px', fontWeight: '700',
                            textDecoration: 'none', fontSize: '0.82rem'
                          }}
                        >
                          <Phone size={14} /> Solicitar Asistencia por WhatsApp
                        </a>
                      )}
                    </div>
                  ) : !isEditingReschedule ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        ¿Deseas cambiar el día, la hora o la cancha de tu partido?
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingReschedule(true)}
                        style={{
                          padding: '10px 18px', borderRadius: '8px', border: `1.5px solid ${primaryColor}`,
                          backgroundColor: `${primaryColor}10`, color: primaryColor, fontWeight: '800',
                          fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Clock size={16} /> Reagendar Fecha / Cancha
                      </button>
                    </div>
                  ) : (
                    /* Inline Reschedule Form */
                    <form onSubmit={handlePublicReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color={primaryColor} />
                        Selecciona el nuevo turno para tu partido:
                      </div>

                      {/* Cancha Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                          Cancha Deportiva *
                        </label>
                        <select
                          value={rescheduleCourtId}
                          onChange={e => setRescheduleCourtId(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: '600', fontSize: '0.88rem' }}
                        >
                          {courts.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (₡{Number(c.basePrice).toLocaleString()})</option>
                          ))}
                        </select>
                      </div>

                      {/* Fecha Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                          Nueva Fecha *
                        </label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => {
                            setRescheduleDate(e.target.value);
                            setRescheduleTime('');
                          }}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: '600', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Horario Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                          Horario Disponible * {rescheduleDate && <span style={{ color: primaryColor, fontWeight: 'normal' }}>({formatFriendlyDate(rescheduleDate)})</span>}
                        </label>
                        {rescheduleSlots.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '6px', maxHeight: '130px', overflowY: 'auto', padding: '2px' }}>
                            {rescheduleSlots.map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setRescheduleTime(slot)}
                                style={{
                                  padding: '8px 4px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
                                  border: rescheduleTime === slot ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                                  backgroundColor: rescheduleTime === slot ? primaryColor : 'white',
                                  color: rescheduleTime === slot ? 'white' : '#1e293b',
                                  textAlign: 'center'
                                }}
                              >
                                {formatTime12h(slot)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#ea580c', backgroundColor: '#fffbeb', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #fef3c7' }}>
                            No hay turnos disponibles para esta cancha en la fecha seleccionada.
                          </div>
                        )}
                      </div>

                      {/* Motivo Opcional */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                          Motivo del cambio (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Cambio por lluvia o mutuo acuerdo"
                          value={rescheduleReason}
                          onChange={e => setRescheduleReason(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} color="#15803d" />
                        <span>Al confirmar, se actualizará tu reserva y enviaremos una confirmación inmediata por WhatsApp.</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingReschedule(false)}
                          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={rescheduling || !rescheduleTime}
                          style={{
                            flex: 1.5, padding: '10px', borderRadius: '8px', border: 'none',
                            backgroundColor: primaryColor, color: 'white', fontWeight: '800', cursor: 'pointer',
                            opacity: (!rescheduleTime || rescheduling) ? 0.6 : 1
                          }}
                        >
                          {rescheduling ? 'Actualizando...' : 'Confirmar Reagendamiento'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            )}

            {/* If no booking loaded yet */}
            {!managedBooking && !searchingBooking && !searchError && (
              <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '14px', textAlign: 'center', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                <Clock size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3, color: primaryColor }} />
                <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: '800' }}>
                  ¿Ya tienes una reserva agendada?
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '420px', marginInline: 'auto' }}>
                  Ingresa tu código de reserva arriba para verificar su estado de confirmación, monto y fecha, o reagendarla si necesitas cambiar de horario.
                </p>
              </div>
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
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: primaryColor, letterSpacing: '0.04em', margin: '4px 0', fontFamily: 'monospace' }}>
                {confirmedBooking.bookingCode || `#RES-${confirmedBooking.id.substring(0, 8).toUpperCase()}`}
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
