import React, { useState, useEffect, useRef } from 'react';
import { Store, Palette, Link as LinkIcon, Copy, ExternalLink, Save, CheckCircle, Upload, Image as ImageIcon, Sparkles, Pipette, Info, Utensils, ShoppingBag, Truck, MapPin, Package, Navigation } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { StoreSettings as StoreSettingsType, StoreTheme, RestaurantConfig, DeliveryConfig } from '../../shared/types';

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'restaurant' | 'delivery' | 'design'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState(false);

  // Form Fields
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [storeMode, setStoreMode] = useState<'retail' | 'restaurant'>('retail');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBannerUrl, setStoreBannerUrl] = useState('');
  const [currency, setCurrency] = useState('CRC');
  const [acceptSinpe, setAcceptSinpe] = useState(true);
  const [sinpePhone, setSinpePhone] = useState('');
  const [sinpeName, setSinpeName] = useState('');
  const [acceptTransfer, setAcceptTransfer] = useState(true);
  const [bankAccountInfo, setBankAccountInfo] = useState('');
  const [acceptCashOnDelivery, setAcceptCashOnDelivery] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState(2500);
  const [pickupEnabled, setPickupEnabled] = useState(true);

  // Restaurant Mode Settings
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig>({
    allowDineIn: true,
    dineInMode: 'table_number',
    tableCount: 15,
    allowPickup: true,
    allowDelivery: true
  });

  // Delivery & Correos de Costa Rica Settings
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: 'flat',
    storeLocation: {
      lat: 9.9333,
      lng: -84.0833,
      address: 'San José, Costa Rica'
    },
    baseDeliveryFee: 1500,
    baseDeliveryKm: 3,
    feePerExtraKm: 350,
    maxDeliveryRadiusKm: 25,
    correosCrEnabled: true,
    originLocationType: 'GAM',
    correosIncludeIva: true
  });

  // Design & Theme Fields
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [cardRadius, setCardRadius] = useState<'square' | 'rounded' | 'pill'>('rounded');
  const [cardShadow, setCardShadow] = useState<'none' | 'sm' | 'md' | 'lg'>('md');
  const [fontFamily, setFontFamily] = useState<'Inter' | 'Poppins' | 'Roboto' | 'Montserrat' | 'Playfair Display'>('Inter');

  // File Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [fetchingStoreGps, setFetchingStoreGps] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const api = useApi();

  const COLOR_PRESETS = [
    { name: 'Esmeralda', hex: '#16a34a' },
    { name: 'Azul Real', hex: '#2563eb' },
    { name: 'Índigo', hex: '#4f46e5' },
    { name: 'Violeta', hex: '#7c3aed' },
    { name: 'Rojo Carmesí', hex: '#e11d48' },
    { name: 'Naranja Cítrico', hex: '#ea580c' },
    { name: 'Ámbar Dorado', hex: '#d97706' },
    { name: 'Rosa Neón', hex: '#db2777' },
    { name: 'Turquesa', hex: '#0d9488' },
    { name: 'Negro Carbón', hex: '#0f172a' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/api/store');
        if (data) {
          setStoreEnabled(data.storeEnabled !== false);
          setStoreMode(data.storeMode || 'retail');
          if (data.restaurantConfig) {
            setRestaurantConfig({
              allowDineIn: data.restaurantConfig.allowDineIn !== false,
              dineInMode: data.restaurantConfig.dineInMode || 'table_number',
              tableCount: data.restaurantConfig.tableCount || 15,
              allowPickup: data.restaurantConfig.allowPickup !== false,
              allowDelivery: data.restaurantConfig.allowDelivery !== false
            });
          }
          if (data.deliveryConfig) {
            setDeliveryConfig({
              deliveryType: data.deliveryConfig.deliveryType || 'flat',
              storeLocation: data.deliveryConfig.storeLocation || { lat: 9.9333, lng: -84.0833, address: 'San José, Costa Rica' },
              baseDeliveryFee: data.deliveryConfig.baseDeliveryFee ?? 1500,
              baseDeliveryKm: data.deliveryConfig.baseDeliveryKm ?? 3,
              feePerExtraKm: data.deliveryConfig.feePerExtraKm ?? 350,
              maxDeliveryRadiusKm: data.deliveryConfig.maxDeliveryRadiusKm ?? 25,
              correosCrEnabled: data.deliveryConfig.correosCrEnabled !== false,
              originLocationType: data.deliveryConfig.originLocationType || 'GAM',
              correosIncludeIva: data.deliveryConfig.correosIncludeIva !== false
            });
          }
          setStoreName(data.storeName || '');
          setStoreSlug(data.storeSlug || '');
          setStoreDescription(data.storeDescription || '');
          setStoreLogoUrl(data.storeLogoUrl || '');
          setStoreBannerUrl(data.storeBannerUrl || '');
          setCurrency(data.currency || 'CRC');
          setAcceptSinpe(data.acceptSinpe !== false);
          setSinpePhone(data.sinpePhone || '');
          setSinpeName(data.sinpeName || '');
          setAcceptTransfer(data.acceptTransfer !== false);
          setBankAccountInfo(data.bankAccountInfo || '');
          setAcceptCashOnDelivery(data.acceptCashOnDelivery !== false);
          setDeliveryEnabled(data.deliveryEnabled !== false);
          setDeliveryFee(Number(data.deliveryFee) || 0);
          setPickupEnabled(data.pickupEnabled !== false);

          if (data.storeTheme) {
            if (data.storeTheme.primaryColor) setPrimaryColor(data.storeTheme.primaryColor);
            if (data.storeTheme.backgroundColor) setBackgroundColor(data.storeTheme.backgroundColor);
            if (data.storeTheme.cardBackgroundColor) setCardBackgroundColor(data.storeTheme.cardBackgroundColor);
            if (data.storeTheme.cardRadius) setCardRadius(data.storeTheme.cardRadius);
            if (data.storeTheme.cardShadow) setCardShadow(data.storeTheme.cardShadow);
            if (data.storeTheme.fontFamily) setFontFamily(data.storeTheme.fontFamily);
          }
        }
      } catch (err) {
        console.error('Error fetching store settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCaptureStoreLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setFetchingStoreGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryConfig(prev => ({
          ...prev,
          storeLocation: {
            ...prev.storeLocation,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
        }));
        setFetchingStoreGps(false);
      },
      (err) => {
        alert('Error al obtener coordenadas: ' + err.message);
        setFetchingStoreGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      const newLogo = type === 'logo' ? data.url : storeLogoUrl;
      const newBanner = type === 'banner' ? data.url : storeBannerUrl;

      if (type === 'logo') setStoreLogoUrl(data.url);
      else setStoreBannerUrl(data.url);

      // Auto-save immediately to database
      try {
        const cleanSlug = storeSlug ? storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : undefined;
        await api.post('/api/store', {
          storeEnabled,
          storeMode,
          restaurantConfig,
          deliveryConfig,
          storeName,
          storeSlug: cleanSlug || storeSlug,
          storeDescription,
          storeLogoUrl: newLogo,
          storeBannerUrl: newBanner,
          storeTheme: {
            primaryColor,
            backgroundColor,
            cardBackgroundColor,
            cardRadius,
            cardShadow,
            fontFamily,
            bannerUrl: newBanner,
            logoUrl: newLogo
          },
          currency,
          acceptSinpe,
          sinpePhone,
          sinpeName,
          acceptTransfer,
          bankAccountInfo,
          acceptCashOnDelivery,
          deliveryEnabled,
          deliveryFee,
          pickupEnabled
        });
        setSaveMessage(true);
        setTimeout(() => setSaveMessage(false), 3000);
      } catch (e) {}
    } catch (err) {
      alert('Error subiendo archivo: ' + err);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanSlug = storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const theme: StoreTheme = {
        primaryColor,
        backgroundColor,
        cardBackgroundColor,
        cardRadius,
        cardShadow,
        fontFamily,
        bannerUrl: storeBannerUrl,
        logoUrl: storeLogoUrl
      };

      await api.post('/api/store', {
        storeEnabled,
        storeMode,
        restaurantConfig,
        deliveryConfig,
        storeName,
        storeSlug: cleanSlug || storeSlug,
        storeDescription,
        storeLogoUrl,
        storeBannerUrl,
        storeTheme: theme,
        currency,
        acceptSinpe,
        sinpePhone,
        sinpeName,
        acceptTransfer,
        bankAccountInfo,
        acceptCashOnDelivery,
        deliveryEnabled,
        deliveryFee,
        pickupEnabled
      });

      setStoreSlug(cleanSlug || storeSlug);
      setSaveMessage(true);
      setTimeout(() => setSaveMessage(false), 3000);
    } catch (err: any) {
      alert('Error al guardar configuración: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = `${window.location.origin}/tienda/${storeSlug || 'demo'}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración de la tienda...</div>;
  }

  return (
    <div style={{ maxWidth: '980px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración de Tienda & Envíos</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Control de catálogo, modo restaurante, cálculo de envíos por KM, Correos de Costa Rica y diseño
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {saveMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
          <CheckCircle size={18} /> ¡Configuración y tarifas guardadas exitosamente!
        </div>
      )}

      {/* Public Store Link Card */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={20} color="#166534" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {storeMode === 'restaurant' ? 'Menú Digital de tu Restaurante' : 'Enlace Público de tu Tienda'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#14532d', wordBreak: 'break-all' }}>{storeUrl}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyStoreLink}
            style={{ padding: '8px 14px', backgroundColor: 'white', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#166534' }}
          >
            <Copy size={15} /> {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 14px', backgroundColor: '#16a34a', color: 'white', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <ExternalLink size={15} /> Ver Catálogo
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '25px', gap: '10px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Store size={17} /> General & Modalidad
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'delivery' ? '2px solid #2563eb' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'delivery' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Truck size={17} /> 🚚 Envíos, GPS & Correos CR
        </button>

        <button
          onClick={() => setActiveTab('restaurant')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'restaurant' ? '2px solid #ea580c' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'restaurant' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Utensils size={17} /> 🍽️ Modo Restaurante {storeMode === 'restaurant' ? '(Activo)' : ''}
        </button>

        <button
          onClick={() => setActiveTab('design')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'design' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'design' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Palette size={17} /> 🎨 Diseño Visual
        </button>
      </div>

      {/* TAB 1: GENERAL & BASIC SETTINGS */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Modalidad del Catálogo</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div
                onClick={() => setStoreMode('retail')}
                style={{
                  padding: '16px', borderRadius: '10px',
                  border: `2px solid ${storeMode === 'retail' ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: storeMode === 'retail' ? 'rgba(22, 163, 74, 0.05)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShoppingBag size={20} color={storeMode === 'retail' ? 'var(--primary)' : '#64748b'} />
                  <strong style={{ fontSize: '1rem', color: storeMode === 'retail' ? 'var(--primary)' : '#1e293b' }}>
                    Tienda Minorista / Comercio
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Catálogo estándar con compras, carrito y envíos tradicionales.
                </p>
              </div>

              <div
                onClick={() => setStoreMode('restaurant')}
                style={{
                  padding: '16px', borderRadius: '10px',
                  border: `2px solid ${storeMode === 'restaurant' ? '#ea580c' : 'var(--border)'}`,
                  backgroundColor: storeMode === 'restaurant' ? 'rgba(234, 88, 12, 0.05)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Utensils size={20} color={storeMode === 'restaurant' ? '#ea580c' : '#64748b'} />
                  <strong style={{ fontSize: '1rem', color: storeMode === 'restaurant' ? '#ea580c' : '#1e293b' }}>
                    🍽️ Modo Restaurante / Menú Digital
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Menú con pedidos a la mesa (número de mesa), para llevar o express.
                </p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Información Básica</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Nombre del Negocio</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej: Betico Store o Restaurante La Casona"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Slug / Identificador URL</label>
                <input
                  type="text"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Ej: clinicasonrisas"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Descripción Corta o Eslogan</label>
                <textarea
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Ej: Servicios de calidad y entregas express..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY, GPS & CORREOS DE COSTA RICA */}
      {activeTab === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Store Physical Origin Location */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <MapPin size={22} color="#2563eb" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Ubicación de Origen del Local</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Punto de referencia inicial para calcular los kilómetros de distancia de entrega al cliente
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Dirección Física o Localidad</label>
                <input
                  type="text"
                  value={deliveryConfig.storeLocation?.address || ''}
                  onChange={(e) => setDeliveryConfig({
                    ...deliveryConfig,
                    storeLocation: { ...(deliveryConfig.storeLocation || {}), address: e.target.value }
                  })}
                  placeholder="Ej: 100m norte del Parque Central, San José"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '3px' }}>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryConfig.storeLocation?.lat || 9.9333}
                    onChange={(e) => setDeliveryConfig({
                      ...deliveryConfig,
                      storeLocation: { ...(deliveryConfig.storeLocation || {}), lat: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '3px' }}>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryConfig.storeLocation?.lng || -84.0833}
                    onChange={(e) => setDeliveryConfig({
                      ...deliveryConfig,
                      storeLocation: { ...(deliveryConfig.storeLocation || {}), lng: parseFloat(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCaptureStoreLocation}
                  disabled={fetchingStoreGps}
                  style={{ padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                >
                  <Navigation size={14} /> {fetchingStoreGps ? 'Capturando...' : '📍 Capturar GPS Actual'}
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Express Distance vs Flat Rate */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Tarifa de Envío Local / Moto Express</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div
                onClick={() => setDeliveryConfig({ ...deliveryConfig, deliveryType: 'flat' })}
                style={{
                  padding: '14px', borderRadius: '8px',
                  border: `2px solid ${deliveryConfig.deliveryType === 'flat' ? '#2563eb' : 'var(--border)'}`,
                  backgroundColor: deliveryConfig.deliveryType === 'flat' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <strong style={{ fontSize: '0.9rem', color: deliveryConfig.deliveryType === 'flat' ? '#2563eb' : '#1e293b' }}>
                  💵 Tarifa Plana Fija
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  Mismo costo de envío para cualquier pedido sin importar la distancia.
                </span>
              </div>

              <div
                onClick={() => setDeliveryConfig({ ...deliveryConfig, deliveryType: 'distance' })}
                style={{
                  padding: '14px', borderRadius: '8px',
                  border: `2px solid ${deliveryConfig.deliveryType === 'distance' ? '#2563eb' : 'var(--border)'}`,
                  backgroundColor: deliveryConfig.deliveryType === 'distance' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <strong style={{ fontSize: '0.9rem', color: deliveryConfig.deliveryType === 'distance' ? '#2563eb' : '#1e293b' }}>
                  📐 Cálculo Dinámico por KM
                </strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  Calcula la distancia GPS entre el local y el cliente y cobra por km recorrido.
                </span>
              </div>
            </div>

            {deliveryConfig.deliveryType === 'flat' ? (
              <div style={{ maxWidth: '300px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Costo de Envío Fijo (₡)</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Tarifa Base (₡)</label>
                  <input
                    type="number"
                    value={deliveryConfig.baseDeliveryFee}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, baseDeliveryFee: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Costo mínimo de salida</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>KM Base Incluidos</label>
                  <input
                    type="number"
                    value={deliveryConfig.baseDeliveryKm}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, baseDeliveryKm: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ej: primeros 3 km</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Costo por KM Adicional (₡)</label>
                  <input
                    type="number"
                    value={deliveryConfig.feePerExtraKm}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, feePerExtraKm: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Por cada km extra</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Radio Máximo de Cobertura (KM)</label>
                  <input
                    type="number"
                    value={deliveryConfig.maxDeliveryRadiusKm}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, maxDeliveryRadiusKm: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Límite express</span>
                </div>
              </div>
            )}
          </div>

          {/* Correos de Costa Rica EMS Nacional Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color="#15803d" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>📦 Correos de Costa Rica (EMS Nacional)</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Envíos a todo el país según tarifario oficial GAM y Resto del País
                  </p>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#15803d' }}>
                <input
                  type="checkbox"
                  checked={deliveryConfig.correosCrEnabled}
                  onChange={(e) => setDeliveryConfig({ ...deliveryConfig, correosCrEnabled: e.target.checked })}
                />
                <span>Habilitar Correos CR</span>
              </label>
            </div>

            {deliveryConfig.correosCrEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                      📍 ¿Dónde está ubicada tu sucursal o bodega?
                    </label>
                    <select
                      value={deliveryConfig.originLocationType}
                      onChange={(e) => setDeliveryConfig({ ...deliveryConfig, originLocationType: e.target.value as any })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                      <option value="GAM">Gran Área Metropolitana (GAM)</option>
                      <option value="RESTO">Resto del País (Rural / Costas)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>
                      Impuesto de Valor Agregado (13% IVA)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px' }}>
                      <input
                        type="checkbox"
                        checked={deliveryConfig.correosIncludeIva}
                        onChange={(e) => setDeliveryConfig({ ...deliveryConfig, correosIncludeIva: e.target.checked })}
                      />
                      <span>Incluir 13% de IVA en la tarifa de Correos de CR</span>
                    </label>
                  </div>
                </div>

                {/* Rates Table Display */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0284c7', color: 'white' }}>
                        <th style={{ padding: '8px 12px' }}>Sucursal Local</th>
                        <th style={{ padding: '8px 12px' }}>Destino del Envío</th>
                        <th style={{ padding: '8px 12px' }}>Primer kg</th>
                        <th style={{ padding: '8px 12px' }}>kg adicional</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: deliveryConfig.originLocationType === 'GAM' ? '#f0f9ff' : 'white' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>GAM</td>
                        <td style={{ padding: '8px 12px' }}>GAM</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>₡2.168,14 {deliveryConfig.correosIncludeIva ? '(+13% = ₡2.450)' : ''}</td>
                        <td style={{ padding: '8px 12px' }}>₡1.238,94</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: deliveryConfig.originLocationType === 'GAM' ? '#f0f9ff' : 'white' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>GAM</td>
                        <td style={{ padding: '8px 12px' }}>Resto del País</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>₡2.964,60 {deliveryConfig.correosIncludeIva ? '(+13% = ₡3.350)' : ''}</td>
                        <td style={{ padding: '8px 12px' }}>₡1.371,68</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: deliveryConfig.originLocationType === 'RESTO' ? '#f0f9ff' : 'white' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Resto del País</td>
                        <td style={{ padding: '8px 12px' }}>GAM</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>₡2.964,60 {deliveryConfig.correosIncludeIva ? '(+13% = ₡3.350)' : ''}</td>
                        <td style={{ padding: '8px 12px' }}>₡1.371,68</td>
                      </tr>
                      <tr style={{ backgroundColor: deliveryConfig.originLocationType === 'RESTO' ? '#f0f9ff' : 'white' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Resto del País</td>
                        <td style={{ padding: '8px 12px' }}>Resto del País</td>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>₡3.761,06 {deliveryConfig.correosIncludeIva ? '(+13% = ₡4.250)' : ''}</td>
                        <td style={{ padding: '8px 12px' }}>₡1.548,67</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RESTAURANT CONFIGURATION */}
      {activeTab === 'restaurant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', backgroundColor: '#ffedd5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Utensils size={22} color="#ea580c" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Configuración de Modo Restaurante</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Personaliza cómo los comensales ordenan en mesa, para llevar o express
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              
              <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: restaurantConfig.allowDineIn ? '14px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={restaurantConfig.allowDineIn}
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowDineIn: e.target.checked })}
                  />
                  <span>🍽️ Permitir Comer en el Local (En Mesa)</span>
                </label>

                {restaurantConfig.allowDineIn && (
                  <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                        Modalidad de Mesa:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div
                          onClick={() => setRestaurantConfig({ ...restaurantConfig, dineInMode: 'table_number' })}
                          style={{
                            padding: '10px 14px', borderRadius: '6px',
                            border: `2px solid ${restaurantConfig.dineInMode === 'table_number' ? '#ea580c' : '#cbd5e1'}`,
                            backgroundColor: restaurantConfig.dineInMode === 'table_number' ? 'rgba(234, 88, 12, 0.05)' : 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <strong style={{ fontSize: '0.85rem', color: restaurantConfig.dineInMode === 'table_number' ? '#ea580c' : '#1e293b' }}>
                            🔢 Rotular Número de Mesa
                          </strong>
                        </div>

                        <div
                          onClick={() => setRestaurantConfig({ ...restaurantConfig, dineInMode: 'call_by_name' })}
                          style={{
                            padding: '10px 14px', borderRadius: '6px',
                            border: `2px solid ${restaurantConfig.dineInMode === 'call_by_name' ? '#ea580c' : '#cbd5e1'}`,
                            backgroundColor: restaurantConfig.dineInMode === 'call_by_name' ? 'rgba(234, 88, 12, 0.05)' : 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <strong style={{ fontSize: '0.85rem', color: restaurantConfig.dineInMode === 'call_by_name' ? '#ea580c' : '#1e293b' }}>
                            🗣️ Llamado por Nombre
                          </strong>
                        </div>
                      </div>
                    </div>

                    {restaurantConfig.dineInMode === 'table_number' && (
                      <div style={{ maxWidth: '240px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                          Cantidad de Mesas Disponibles:
                        </label>
                        <input
                          type="number"
                          min={1} max={100}
                          value={restaurantConfig.tableCount || 15}
                          onChange={(e) => setRestaurantConfig({ ...restaurantConfig, tableCount: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={restaurantConfig.allowPickup}
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowPickup: e.target.checked })}
                  />
                  <span>🥡 Permitir Para Llevar / Retiro en Barra</span>
                </label>
              </div>

              <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={restaurantConfig.allowDelivery}
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowDelivery: e.target.checked })}
                  />
                  <span>🛵 Permitir Delivery Express con GPS</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DESIGN & BRANDING */}
      {activeTab === 'design' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Logo y Banner de Portada</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Logo del Negocio</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  {storeLogoUrl ? (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={storeLogoUrl} alt="Logo" style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    </div>
                  ) : (
                    <ImageIcon size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                  )}
                  
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo (512x512)'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Banner de Portada</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  {storeBannerUrl ? (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={storeBannerUrl} alt="Banner" style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    </div>
                  ) : (
                    <ImageIcon size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                  )}
                  
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    {uploadingBanner ? 'Subiendo...' : 'Subir Banner (1200x400)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Colores de Marca</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Color Primario de Marca</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {COLOR_PRESETS.map(c => (
                    <div
                      key={c.hex}
                      onClick={() => setPrimaryColor(c.hex)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: c.hex, cursor: 'pointer',
                        border: primaryColor === c.hex ? '3px solid #000' : '2px solid transparent',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '240px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
