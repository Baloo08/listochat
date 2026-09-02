import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, DollarSign, Plus, Edit, Trash2, 
  Check, X, Settings, Clock, MapPin 
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking, CourtsConfig } from '../../shared/types';

export default function CourtsManager() {
  const [activeTab, setActiveTab] = useState<'canchas' | 'reservas' | 'config'>('canchas');
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [config, setConfig] = useState<CourtsConfig>({
    paymentMode: 'both',
    matchExpiryHours: 1,
    allowSeekMatch: true,
    sportTypes: ['futbol', 'padel', 'tenis']
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('Cancha 1');
  const [sportType, setSportType] = useState('futbol');
  const [customSportType, setCustomSportType] = useState('');
  const [basePrice, setBasePrice] = useState(15000);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [teamSize, setTeamSize] = useState(5);
  const [maxExtraPlayers, setMaxExtraPlayers] = useState(2);
  const [extraPlayerFee, setExtraPlayerFee] = useState(2000);
  const [surface, setSurface] = useState('');
  const [isIndoor, setIsIndoor] = useState(false);
  const [hasLighting, setHasLighting] = useState(false);
  const [active, setActive] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('');

  const api = useApi();

  const fetchData = async () => {
    setLoading(true);
    try {
      const courtsData = await api.get('/api/courts');
      if (courtsData) setCourts(courtsData);
      
      const storeData = await api.get('/api/store');
      if (storeData && storeData.storeModules && storeData.storeModules.courtsConfig) {
        setConfig(storeData.storeModules.courtsConfig);
      }
      if (storeData?.storeSlug) setTenantSlug(storeData.storeSlug);
    } catch (error) {
      console.error('Error fetching courts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const bData = await api.get(`/api/courts/bookings?date=${filterDate}`);
      if (bData) setBookings(bData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservas') {
      fetchBookings();
    }
  }, [activeTab, filterDate]);

  const handleOpenCreateModal = () => {
    setEditingCourt(null);
    setName('Cancha 1');
    setSportType('futbol');
    setCustomSportType('');
    setBasePrice(15000);
    setDurationMinutes(60);
    setTeamSize(5);
    setMaxExtraPlayers(2);
    setExtraPlayerFee(2000);
    setSurface('');
    setIsIndoor(false);
    setHasLighting(false);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Court) => {
    setEditingCourt(c);
    setName(c.name);
    setSportType(c.sportType);
    setCustomSportType(c.customSportType || '');
    setBasePrice(c.basePrice);
    setDurationMinutes(c.durationMinutes);
    setTeamSize(c.teamSize);
    setMaxExtraPlayers(c.maxExtraPlayers);
    setExtraPlayerFee(c.extraPlayerFee);
    setSurface(c.surface || '');
    setIsIndoor(c.isIndoor);
    setHasLighting(c.hasLighting);
    setActive(c.active);
    setIsModalOpen(true);
  };

  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        sportType,
        customSportType: sportType === 'otro' ? customSportType : '',
        basePrice: Number(basePrice),
        durationMinutes: Number(durationMinutes),
        teamSize: Number(teamSize),
        maxExtraPlayers: Number(maxExtraPlayers),
        extraPlayerFee: Number(extraPlayerFee),
        surface,
        isIndoor,
        hasLighting,
        active
      };

      if (editingCourt) {
        await api.put(`/api/courts/${editingCourt.id}`, payload);
      } else {
        await api.post('/api/courts', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Error al guardar cancha');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourt = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cancha?')) return;
    try {
      await api.del(`/api/courts/${id}`);
      fetchData();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const handleSaveConfig = async () => {
    try {
      const storeData = await api.get('/api/store');
      await api.post('/api/store', {
        ...storeData,
        storeModules: {
          ...storeData.storeModules,
          courtsConfig: config
        }
      });
      alert('Configuración guardada correctamente');
    } catch (error) {
      alert('Error al guardar configuración');
    }
  };

  const handleUpdateBookingStatus = async (id: string, action: string) => {
    try {
      await api.post(`/api/courts/bookings/${id}/action`, { action });
      fetchBookings();
    } catch (error) {
      alert('Error al actualizar reserva');
    }
  };

  const getStatusBadge = (status: string, matchStatus: string) => {
    if (status === 'cancelled') return <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cancelado</span>;
    if (matchStatus === 'open') return <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Busca Reto</span>;
    if (matchStatus === 'matched') return <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Reto Aceptado</span>;
    if (matchStatus === 'expired') return <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Expirado</span>;
    return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Confirmado</span>;
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando canchas...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Gestión de Canchas</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Administra tus canchas deportivas, reservas y busca retos.
          </p>
        </div>
      </div>

      {/* URL Pública de Canchas */}
      {tenantSlug && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '10px', marginBottom: '16px', flexWrap: 'wrap'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Página pública:</span>
          <code style={{
            backgroundColor: 'var(--bg)', padding: '4px 10px', borderRadius: '6px',
            fontSize: '0.82rem', flex: 1, minWidth: '200px', wordBreak: 'break-all'
          }}>
            {window.location.origin}/canchas/{tenantSlug}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/canchas/${tenantSlug}`); }}
            style={{
              padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer'
            }}
          >
            Copiar
          </button>
          <a
            href={`/canchas/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--primary)',
              border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.78rem',
              fontWeight: '700', textDecoration: 'none', cursor: 'pointer'
            }}
          >
            Abrir
          </a>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('canchas')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'canchas' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'canchas' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Trophy size={18} /> Mis Canchas
        </button>
        <button
          onClick={() => setActiveTab('reservas')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'reservas' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'reservas' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Calendar size={18} /> Reservas
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'config' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'config' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Settings size={18} /> Configuración
        </button>
      </div>

      {/* Tab Content: Mis Canchas */}
      {activeTab === 'canchas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button
              onClick={handleOpenCreateModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Plus size={16} /> Agregar Cancha
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {courts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                No tienes canchas registradas.
              </div>
            ) : courts.map(c => (
              <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{c.name}</h3>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {c.sportType === 'otro' ? c.customSportType : c.sportType.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEditModal(c)} style={{ padding: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Edit size={14} /></button>
                    <button onClick={() => handleDeleteCourt(c.id)} style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> ₡{c.basePrice.toLocaleString()} / {c.durationMinutes} min</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {c.teamSize} vs {c.teamSize} (+{c.maxExtraPlayers} extras a ₡{c.extraPlayerFee})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {c.surface || 'Superficie no definida'}</div>
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {c.isIndoor && <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Techada</span>}
                  {c.hasLighting && <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Iluminación</span>}
                  {!c.active && <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Inactiva</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Reservas */}
      {activeTab === 'reservas' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Fecha:</label>
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                No hay reservas para esta fecha.
              </div>
            ) : bookings.map(b => (
              <div key={b.id} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{b.time} - {b.courtName}</div>
                  {getStatusBadge(b.status, b.matchStatus)}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1d4ed8' }}>Equipo A: {b.teamAName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>Capitán: {b.teamACaptain} ({b.teamAPhone})</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>Jugadores: {b.teamAPlayers} + {b.teamAExtraPlayers} extras</div>
                    <div style={{ marginTop: '6px' }}>
                      {b.teamAPaid ? (
                        <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12}/> Pagado</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold' }}>Pendiente de pago</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    {b.bookingMode === 'seek_match' && !b.teamBName ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Buscando rival... ({b.skillLevel})
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#be123c' }}>Equipo B: {b.teamBName || 'Rival'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>Capitán: {b.teamBCaptain} ({b.teamBPhone})</div>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>Jugadores: {b.teamBPlayers} + {b.teamBExtraPlayers} extras</div>
                        <div style={{ marginTop: '6px' }}>
                          {b.teamBPaid ? (
                            <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12}/> Pagado</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold' }}>Pendiente de pago</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'bold' }}>Total: ₡{b.totalPrice.toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {b.status !== 'cancelled' && !b.teamAPaid && (
                      <button onClick={() => handleUpdateBookingStatus(b.id, 'pay_team_a')} style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Pago A</button>
                    )}
                    {b.status !== 'cancelled' && b.teamBName && !b.teamBPaid && (
                      <button onClick={() => handleUpdateBookingStatus(b.id, 'pay_team_b')} style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Pago B</button>
                    )}
                    {b.status !== 'cancelled' && (
                      <button onClick={() => handleUpdateBookingStatus(b.id, 'cancel')} style={{ padding: '6px 12px', backgroundColor: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Configuración */}
      {activeTab === 'config' && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Configuración Global de Canchas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={config.allowSeekMatch} 
                onChange={(e) => setConfig({...config, allowSeekMatch: e.target.checked})}
              />
              <span style={{ fontWeight: '600' }}>Permitir "Busca Reto" (Partidos Abiertos)</span>
            </label>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>Horas de expiración de búsqueda</label>
              <input 
                type="number" 
                value={config.matchExpiryHours} 
                onChange={(e) => setConfig({...config, matchExpiryHours: Number(e.target.value)})}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', width: '100px' }}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tiempo antes del partido en el que la reserva expira si no encuentra rival.</div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>Modo de Pago</label>
              <select 
                value={config.paymentMode}
                onChange={(e) => setConfig({...config, paymentMode: e.target.value as any})}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', width: '100%' }}
              >
                <option value="online">Solo Pago Online / Adelantado</option>
                <option value="on_site">Pago en Sitio</option>
                <option value="both">Ambos (Cliente elige)</option>
              </select>
            </div>

            <button 
              onClick={handleSaveConfig}
              style={{ padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      )}

      {/* Modal: Agregar / Editar Cancha */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingCourt ? 'Editar Cancha' : 'Nueva Cancha'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <form onSubmit={handleSaveCourt} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Deporte</label>
                  <select value={sportType} onChange={e => setSportType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value="futbol">Fútbol</option>
                    <option value="padel">Pádel</option>
                    <option value="tenis">Tenis</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {sportType === 'otro' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>¿Cuál?</label>
                    <input type="text" required value={customSportType} onChange={e => setCustomSportType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Precio Base (₡)</label>
                  <input type="number" required value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Duración por reserva</label>
                  <select value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Jugadores x Eq.</label>
                  <input type="number" required value={teamSize} onChange={e => setTeamSize(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Máx Extras</label>
                  <input type="number" required value={maxExtraPlayers} onChange={e => setMaxExtraPlayers(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Cobro Extra (₡)</label>
                  <input type="number" required value={extraPlayerFee} onChange={e => setExtraPlayerFee(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Superficie</label>
                <input type="text" placeholder="Ej: Sintética, natural, cristal" value={surface} onChange={e => setSurface(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={isIndoor} onChange={e => setIsIndoor(e.target.checked)} /> Bajo techo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={hasLighting} onChange={e => setHasLighting(e.target.checked)} /> Iluminación
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Activa
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
