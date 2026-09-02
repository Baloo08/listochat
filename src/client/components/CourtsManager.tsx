import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Plus, Edit, Trash2, Check, X, Settings, Clock, 
  MapPin, Palette, Globe, Save, Copy, ExternalLink, ShieldCheck, 
  Sliders, DollarSign, Users, RefreshCw, Upload, Image as ImageIcon
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtsConfig, CourtsTheme } from '../../shared/types';

export default function CourtsManager() {
  const [activeTab, setActiveTab] = useState<'canchas' | 'diseno' | 'reglas'>('canchas');
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // File Upload State & Refs
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Config & Theme state
  const [config, setConfig] = useState<CourtsConfig>({
    paymentMode: 'both',
    matchExpiryHours: 1,
    allowSeekMatch: true,
    sportTypes: ['futbol', 'padel', 'tenis'],
    theme: {
      primaryColor: '#16a34a',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter',
      title: '',
      description: '',
      logoUrl: '',
      bannerUrl: '',
      announcement: '',
      sinpePhone: '',
      sinpeName: '',
      bankAccountInfo: ''
    }
  });

  // Modal State for Courts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [savingCourt, setSavingCourt] = useState(false);

  // Form Fields for Court CRUD
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

  const api = useApi();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courtsData, storeData] = await Promise.all([
        api.get('/api/courts'),
        api.get('/api/store')
      ]);

      if (courtsData) setCourts(courtsData);
      
      if (storeData) {
        if (storeData.storeSlug) setTenantSlug(storeData.storeSlug);
        
        const existingCourtsConfig = storeData.storeModules?.courtsConfig;
        if (existingCourtsConfig) {
          setConfig({
            paymentMode: existingCourtsConfig.paymentMode || 'both',
            matchExpiryHours: existingCourtsConfig.matchExpiryHours ?? 1,
            allowSeekMatch: existingCourtsConfig.allowSeekMatch !== false,
            sportTypes: existingCourtsConfig.sportTypes || ['futbol', 'padel', 'tenis'],
            theme: {
              primaryColor: existingCourtsConfig.theme?.primaryColor || storeData.storeTheme?.primaryColor || '#16a34a',
              accentColor: existingCourtsConfig.theme?.accentColor || storeData.storeTheme?.accentColor || '#f59e0b',
              backgroundColor: existingCourtsConfig.theme?.backgroundColor || '#f8fafc',
              fontFamily: existingCourtsConfig.theme?.fontFamily || storeData.storeTheme?.fontFamily || 'Inter',
              title: existingCourtsConfig.theme?.title || storeData.storeName || '',
              description: existingCourtsConfig.theme?.description || storeData.storeDescription || '',
              logoUrl: existingCourtsConfig.theme?.logoUrl || storeData.storeLogoUrl || '',
              bannerUrl: existingCourtsConfig.theme?.bannerUrl || storeData.storeBannerUrl || '',
              announcement: existingCourtsConfig.theme?.announcement || '',
              sinpePhone: existingCourtsConfig.theme?.sinpePhone || storeData.sinpePhone || '',
              sinpeName: existingCourtsConfig.theme?.sinpeName || storeData.sinpeName || '',
              bankAccountInfo: existingCourtsConfig.theme?.bankAccountInfo || storeData.bankAccountInfo || ''
            }
          });
        } else {
          setConfig(prev => ({
            ...prev,
            theme: {
              ...prev.theme,
              title: storeData.storeName || '',
              description: storeData.storeDescription || '',
              logoUrl: storeData.storeLogoUrl || '',
              bannerUrl: storeData.storeBannerUrl || '',
              sinpePhone: storeData.sinpePhone || '',
              sinpeName: storeData.sinpeName || '',
              bankAccountInfo: storeData.bankAccountInfo || ''
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching courts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = fieldName === 'logoUrl';
    if (isLogo) setUploadingLogo(true);
    else setUploadingBanner(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (data && data.url) {
        setConfig(prev => ({
          ...prev,
          theme: {
            ...prev.theme,
            [fieldName]: data.url
          }
        }));
      } else {
        alert('Error al subir la imagen: ' + (data?.error || 'Respuesta inválida'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error de conexión al subir la imagen.');
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

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
    setSavingCourt(true);
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
      setSavingCourt(false);
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

  const handleSaveFullConfig = async () => {
    setSavingConfig(true);
    try {
      const storeData = await api.get('/api/store');
      await api.post('/api/store', {
        ...storeData,
        storeModules: {
          ...storeData?.storeModules,
          courtsEnabled: true,
          courtsConfig: config
        }
      });
      alert('¡Configuración e imágenes de canchas guardadas con éxito!');
    } catch (error) {
      alert('Error al guardar configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/canchas/${tenantSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const colorPresets = [
    { label: 'Verde Césped', primary: '#16a34a', accent: '#f59e0b' },
    { label: 'Azul Deportivo', primary: '#2563eb', accent: '#06b6d4' },
    { label: 'Naranja Pádel', primary: '#ea580c', accent: '#facc15' },
    { label: 'Rojo Pasión', primary: '#dc2626', accent: '#fb923c' },
    { label: 'Púrpura Arena', primary: '#7c3aed', accent: '#ec4899' },
    { label: 'Oscuro Premium', primary: '#0f172a', accent: '#38bdf8' }
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando módulo de canchas...</div>;

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={e => handleImageUpload(e, 'logoUrl')}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={e => handleImageUpload(e, 'bannerUrl')}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)' }}>
            Gestión de Canchas
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configura tus canchas, personaliza el portal público y ajusta las reglas de juego.
          </p>
        </div>
      </div>

      {/* URL BANNER */}
      {tenantSlug && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap'
        }}>
          <Globe size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: '700' }}>Portal público de canchas:</span>
          <code style={{
            backgroundColor: 'var(--bg-elevated)', padding: '5px 12px', borderRadius: '6px',
            fontSize: '0.82rem', flex: 1, minWidth: '220px', wordBreak: 'break-all', color: 'var(--text)'
          }}>
            {window.location.origin}/canchas/{tenantSlug}
          </code>
          <button
            type="button"
            onClick={copyPublicUrl}
            style={{
              padding: '7px 14px', backgroundColor: copiedUrl ? '#16a34a' : 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
            {copiedUrl ? '¡Copiado!' : 'Copiar'}
          </button>
          <a
            href={`/canchas/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '7px 14px', backgroundColor: 'transparent', color: 'var(--primary)',
              border: '1.5px solid var(--primary)', borderRadius: '8px', fontSize: '0.8rem',
              fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <ExternalLink size={14} /> Abrir
          </a>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('canchas')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'canchas' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'canchas' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Trophy size={18} /> Mis Canchas ({courts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diseno')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'diseno' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'diseno' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Palette size={18} /> Personalización & Diseño
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reglas')}
          style={{
            padding: '10px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === 'reglas' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'reglas' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Sliders size={18} /> Reglas Deportivas & Modos
        </button>
      </div>

      {/* TAB 1: MIS CANCHAS */}
      {activeTab === 'canchas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Total de canchas disponibles para reserva: <strong>{courts.length}</strong>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Nueva Cancha
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {courts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <Trophy size={40} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
                <div style={{ fontWeight: '700', color: 'var(--text)' }}>No tienes canchas registradas</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Haz clic en "+ Nueva Cancha" para comenzar.</div>
              </div>
            ) : (
              courts.map(c => (
                <div 
                  key={c.id}
                  style={{
                    backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '18px',
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px',
                    opacity: c.active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>{c.name}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                        {c.sportType === 'otro' ? c.customSportType || 'Deporte' : c.sportType}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: c.active ? '#dcfce7' : '#f1f5f9',
                      color: c.active ? '#15803d' : '#64748b',
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700'
                    }}>
                      {c.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span>{c.durationMinutes} minutos por turno</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} color="var(--text-muted)" />
                      <span>{c.teamSize} vs {c.teamSize} (hasta +{c.maxExtraPlayers} extras)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={14} color="var(--text-muted)" />
                      <strong>₡{Number(c.basePrice).toLocaleString()} / turno</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(c)}
                      style={{
                        flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-elevated)', color: 'var(--text)', fontSize: '0.8rem',
                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourt(c.id)}
                      style={{
                        padding: '7px 12px', borderRadius: '6px', border: '1px solid #fecaca',
                        backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '0.8rem',
                        fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PERSONALIZACIÓN & DISEÑO */}
      {activeTab === 'diseno' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Identidad & Textos */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="var(--primary)" /> Textos del Portal de Canchas
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Título Principal del Portal
                </label>
                <input
                  type="text"
                  placeholder="Ej. Complejo Deportivo Betico"
                  value={config.theme?.title || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, title: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Subtítulo / Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Canchas de Fútbol 5, Pádel y Tenis en San José"
                  value={config.theme?.description || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, description: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Aviso o Políticas para Jugadores (Banner informativo)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Llegar con 10 minutos de anticipación. Tolerancia máxima de espera 10 minutos. Cancelaciones con 4 horas de previo aviso."
                  value={config.theme?.announcement || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, announcement: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Card: Logo & Portada con Subida Directa de Archivo (Mismo protocolo de Tienda / Sitio) */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} color="var(--primary)" /> Imagen de Perfil y Portada
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Imagen de Perfil / Logo */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text)' }}>
                  Foto de Perfil / Logo
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '12px', backgroundColor: 'var(--background)',
                    border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {config.theme?.logoUrl ? (
                      <img src={config.theme.logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={24} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      style={{
                        padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      {uploadingLogo ? 'Subiendo...' : config.theme?.logoUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </button>
                    {config.theme?.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, theme: { ...config.theme, logoUrl: '' } })}
                        style={{
                          padding: '4px 8px', background: 'none', color: '#e11d48', border: 'none',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left'
                        }}
                      >
                        Eliminar imagen
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="O ingresa URL directa https://..."
                  value={config.theme?.logoUrl || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, logoUrl: e.target.value } })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Portada / Banner */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text)' }}>
                  Foto de Portada / Banner
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{
                    width: '100px', height: '64px', borderRadius: '10px', backgroundColor: 'var(--background)',
                    border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {config.theme?.bannerUrl ? (
                      <img src={config.theme.bannerUrl} alt="Banner preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={24} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                      style={{
                        padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      {uploadingBanner ? 'Subiendo...' : config.theme?.bannerUrl ? 'Cambiar Portada' : 'Subir Portada'}
                    </button>
                    {config.theme?.bannerUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, theme: { ...config.theme, bannerUrl: '' } })}
                        style={{
                          padding: '4px 8px', background: 'none', color: '#e11d48', border: 'none',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left'
                        }}
                      >
                        Eliminar portada
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="O ingresa URL directa https://..."
                  value={config.theme?.bannerUrl || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, bannerUrl: e.target.value } })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>

            </div>
          </div>

          {/* Card: Colores & Tipografía */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} color="var(--primary)" /> Paleta de Colores & Estilo Visual
            </h3>

            {/* Presets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Temas Rápidos Prediseñados:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {colorPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      theme: { ...config.theme, primaryColor: p.primary, accentColor: p.accent }
                    })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)',
                      cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700'
                    }}
                  >
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.primary }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.accent }} />
                    <span style={{ color: 'var(--text)' }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Color Primario
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={config.theme?.primaryColor || '#16a34a'}
                    onChange={e => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={config.theme?.primaryColor || '#16a34a'}
                    onChange={e => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Color de Acento / Retos
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={config.theme?.accentColor || '#f59e0b'}
                    onChange={e => setConfig({ ...config, theme: { ...config.theme, accentColor: e.target.value } })}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={config.theme?.accentColor || '#f59e0b'}
                    onChange={e => setConfig({ ...config, theme: { ...config.theme, accentColor: e.target.value } })}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Tipografía
                </label>
                <select
                  value={config.theme?.fontFamily || 'Inter'}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, fontFamily: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="Inter">Inter (Moderna & Limpia)</option>
                  <option value="Outfit">Outfit (Deportiva & Geométrica)</option>
                  <option value="Poppins">Poppins (Redonda & Amigable)</option>
                  <option value="Roboto">Roboto (Estándar)</option>
                  <option value="Montserrat">Montserrat (Elegante)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Datos de Pago (SINPE Móvil & Transferencia) */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary)" /> Instrucciones de Pago para Jugadores
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Teléfono SINPE Móvil
                </label>
                <input
                  type="text"
                  placeholder="Ej. 88887777"
                  value={config.theme?.sinpePhone || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, sinpePhone: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Nombre del Titular SINPE
                </label>
                <input
                  type="text"
                  placeholder="Ej. Canchas Deportivas S.A."
                  value={config.theme?.sinpeName || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, sinpeName: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Cuenta IBAN / Transferencia Bancaria (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. CR05015202001123456789 (BAC Credomatic)"
                  value={config.theme?.bankAccountInfo || ''}
                  onChange={e => setConfig({ ...config, theme: { ...config.theme, bankAccountInfo: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleSaveFullConfig}
              disabled={savingConfig}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px',
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
              }}
            >
              <Save size={18} />
              {savingConfig ? 'Guardando...' : 'Guardar Personalización'}
            </button>
          </div>

        </div>
      )}

      {/* TAB 3: REGLAS DEPORTIVAS & MODOS */}
      {activeTab === 'reglas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--primary)" /> Opciones de Reserva y Cobro
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
                  Modalidad de Cobro
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'both', label: 'Ambas opciones (Pago en línea / En sitio)' },
                    { id: 'online', label: 'Solo Pago previo (SINPE Móvil / Transferencia)' },
                    { id: 'on_site', label: 'Solo Cobro en sitio (Al llegar)' }
                  ].map(m => (
                    <label 
                      key={m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                        borderRadius: '8px', border: config.paymentMode === m.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: config.paymentMode === m.id ? 'var(--primary-light)' : 'var(--bg-elevated)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={config.paymentMode === m.id}
                        onChange={() => setConfig({ ...config, paymentMode: m.id as any })}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.allowSeekMatch}
                    onChange={e => setConfig({ ...config, allowSeekMatch: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>
                      Habilitar modalidad "¡Busca Reto!"
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Permite que un equipo reserve pagando la mitad y publique el partido en la web para buscar retador.
                    </div>
                  </div>
                </label>
              </div>

              {config.allowSeekMatch && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                    Cierre automático de búsqueda de reto
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={config.matchExpiryHours}
                      onChange={e => setConfig({ ...config, matchExpiryHours: Number(e.target.value) })}
                      style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      hora(s) antes del inicio del partido si nadie se une.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSaveFullConfig}
              disabled={savingConfig}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px',
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer'
              }}
            >
              <Save size={18} />
              {savingConfig ? 'Guardando...' : 'Guardar Reglas'}
            </button>
          </div>

        </div>
      )}

      {/* CREATE / EDIT COURT MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: '16px', maxWidth: '520px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                {editingCourt ? 'Editar Cancha' : 'Nueva Cancha'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                  Nombre de la Cancha *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Cancha 1, Cancha Sintética A, Pádel Panorámica"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Tipo de Deporte
                  </label>
                  <select
                    value={sportType}
                    onChange={e => setSportType(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  >
                    <option value="futbol">Fútbol 5 / 7 / 11</option>
                    <option value="padel">Pádel</option>
                    <option value="tenis">Tenis</option>
                    <option value="baloncesto">Baloncesto</option>
                    <option value="voleibol">Voleibol</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {sportType === 'otro' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                      Especificar Deporte
                    </label>
                    <input
                      type="text"
                      value={customSportType}
                      onChange={e => setCustomSportType(e.target.value)}
                      placeholder="Ej. Pickleball"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Precio por Turno (₡) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={basePrice}
                    onChange={e => setBasePrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Duración Turno (minutos)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Jugadores por Equipo
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={teamSize}
                    onChange={e => setTeamSize(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Máx. Jugadores Extra
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxExtraPlayers}
                    onChange={e => setMaxExtraPlayers(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Cobro por Jugador Extra (₡)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extraPlayerFee}
                    onChange={e => setExtraPlayerFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasLighting}
                    onChange={e => setHasLighting(e.target.checked)}
                  />
                  <span>Iluminación nocturna</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isIndoor}
                    onChange={e => setIsIndoor(e.target.checked)}
                  />
                  <span>Bajo techo / Techada</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                  />
                  <span>Activa para reservas</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCourt}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer' }}
                >
                  {savingCourt ? 'Guardando...' : editingCourt ? 'Actualizar' : 'Crear Cancha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
