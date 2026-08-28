import React, { useState, useEffect, useRef } from 'react';
import { Store, Palette, Link as LinkIcon, Copy, ExternalLink, Save, CheckCircle, Upload, Image as ImageIcon, Sparkles, Pipette, Info, Utensils, ShoppingBag, Truck, MapPin, Package, Navigation, Users, Plus, Trash2, Phone, Bike, MessageSquare, Key, HelpCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { StoreSettings as StoreSettingsType, StoreTheme, RestaurantConfig, DeliveryConfig, DeliveryDriver, NotificationTemplates } from '../../shared/types';

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'restaurant' | 'delivery' | 'drivers' | 'templates' | 'design'>('general');
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
    allowTableNumber: true,
    allowCallByName: true,
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

  // Notification Templates State
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplates>({
    orderReceived: `🎉 *¡Gracias por tu pedido en {tienda}!*

Hola *{cliente}*, hemos recibido con éxito tu orden *#ORD-{pedido}*.

💰 *Total:* {total}
📦 *Estado:* En preparación

Te estaremos notificando cuando tu pedido esté listo o en camino. ¡Muchas gracias por tu preferencia! ⭐`,
    
    orderInTransit: `🛵 *¡Tu pedido ya va en camino!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* acaba de salir y va en camino con nuestro repartidor *{repartidor}*.

💰 *Monto a pagar al recibir:* {cobro}
¡Pronto estaremos en tu puerta! 🚀`,

    orderDelivered: `🎉 *¡Tu pedido ha sido entregado con éxito!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* ha sido entregada por nuestro repartidor *{repartidor}*.

¡Muchas gracias por tu preferencia! Esperamos que lo disfrutes. ⭐`,

    driverDispatch: `🛵 *NUEVA ENTREGA ASIGNADA* (#ORD-{pedido})

Hola *{repartidor}*, tienes un nuevo pedido para entregar:

👤 *Cliente:* {cliente}
📞 *Teléfono Cliente:* {telefono}
📍 *Dirección:* {direccion}

{waze_line}{maps_line}
📦 *Platillos / Productos:*
{productos}

💰 *Cobro al Cliente:* {cobro}
{notas_line}`
  });

  // Delivery Drivers State
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPin, setNewDriverPin] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<'moto' | 'bici' | 'auto'>('moto');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  const [addingDriver, setAddingDriver] = useState(false);

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

  const fetchDrivers = async () => {
    try {
      const data = await api.get('/api/drivers');
      if (data) setDrivers(data);
    } catch (e) {
      console.error('Error fetching drivers:', e);
    }
  };

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
              allowTableNumber: data.restaurantConfig.allowTableNumber !== false,
              allowCallByName: data.restaurantConfig.allowCallByName !== false,
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
          if (data.notificationTemplates) {
            setNotificationTemplates(prev => ({
              ...prev,
              ...data.notificationTemplates
            }));
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
    fetchDrivers();
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

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) {
      alert('Nombre y teléfono del repartidor son requeridos');
      return;
    }
    setAddingDriver(true);
    try {
      const pinToUse = newDriverPin || Math.floor(1000 + Math.random() * 9000).toString();
      await api.post('/api/drivers', {
        name: newDriverName,
        phone: newDriverPhone,
        accessPin: pinToUse,
        vehicleType: newDriverVehicle,
        plateNumber: newDriverPlate
      });
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverPin('');
      setNewDriverPlate('');
      await fetchDrivers();
    } catch (e: any) {
      alert('Error agregando repartidor: ' + e.message);
    } finally {
      setAddingDriver(false);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('¿Eliminar este repartidor?')) return;
    try {
      await api.del(`/api/drivers/${id}`);
      await fetchDrivers();
    } catch (e) {
      alert('Error eliminando repartidor');
    }
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

      try {
        const cleanSlug = storeSlug ? storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : undefined;
        await api.post('/api/store', {
          storeEnabled,
          storeMode,
          restaurantConfig,
          deliveryConfig,
          notificationTemplates,
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
        notificationTemplates,
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
            Control de catálogo, modo restaurante, cálculo de envíos por KM, plantillas y repartidores
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
          <CheckCircle size={18} /> ¡Configuración guardada exitosamente!
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

      {/* Tabs with Clean Lucide SVG Icons */}
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
          <Utensils size={17} /> Modo Restaurante {storeMode === 'restaurant' ? '(Activo)' : ''}
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
          <Truck size={17} /> Envíos, GPS & Correos CR
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'drivers' ? '2px solid #0d9488' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'drivers' ? '#0d9488' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Bike size={17} /> Repartidores / Motorizados ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'templates' ? '2px solid #8b5cf6' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'templates' ? '#8b5cf6' : 'var(--text-muted)',
            fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <MessageSquare size={17} /> Plantillas de WhatsApp
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
          <Palette size={17} /> Diseño Visual
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
                    Modo Restaurante / Menú Digital
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Menú con pedidos a la mesa (número de mesa), llamado por nombre, para llevar o express.
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

      {/* TAB 2: RESTAURANT MODE */}
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
                  <span>Permitir Comer en el Local (En Mesa)</span>
                </label>

                {restaurantConfig.allowDineIn && (
                  <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                        Modalidades de Identificación en Mesa (Puedes activar ambas):
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <label
                          style={{
                            padding: '12px 14px', borderRadius: '8px',
                            border: `2px solid ${restaurantConfig.allowTableNumber ? '#ea580c' : '#cbd5e1'}`,
                            backgroundColor: restaurantConfig.allowTableNumber ? 'rgba(234, 88, 12, 0.05)' : 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={restaurantConfig.allowTableNumber}
                            onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowTableNumber: e.target.checked })}
                          />
                          <strong style={{ fontSize: '0.85rem', color: restaurantConfig.allowTableNumber ? '#ea580c' : '#1e293b' }}>
                            Rotular Número de Mesa
                          </strong>
                        </label>

                        <label
                          style={{
                            padding: '12px 14px', borderRadius: '8px',
                            border: `2px solid ${restaurantConfig.allowCallByName ? '#ea580c' : '#cbd5e1'}`,
                            backgroundColor: restaurantConfig.allowCallByName ? 'rgba(234, 88, 12, 0.05)' : 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={restaurantConfig.allowCallByName}
                            onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowCallByName: e.target.checked })}
                          />
                          <strong style={{ fontSize: '0.85rem', color: restaurantConfig.allowCallByName ? '#ea580c' : '#1e293b' }}>
                            Llamado por Nombre
                          </strong>
                        </label>
                      </div>
                    </div>

                    {restaurantConfig.allowTableNumber && (
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
                  <span>Permitir Para Llevar / Retiro en Barra</span>
                </label>
              </div>

              <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={restaurantConfig.allowDelivery}
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, allowDelivery: e.target.checked })}
                  />
                  <span>Permitir Delivery Express con GPS y Waze</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY, GPS & CORREOS DE COSTA RICA */}
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
                  <Navigation size={14} /> {fetchingStoreGps ? 'Capturando...' : 'Capturar GPS Actual'}
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
                  Tarifa Plana Fija
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
                  Cálculo Dinámico por KM
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Costo por KM Extra (₡)</label>
                  <input
                    type="number"
                    value={deliveryConfig.feePerExtraKm}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, feePerExtraKm: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Por cada km adicional</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Radio Máximo (KM)</label>
                  <input
                    type="number"
                    value={deliveryConfig.maxDeliveryRadiusKm}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, maxDeliveryRadiusKm: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Límite de cobertura</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REPARTIDORES & CODIGO PIN */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="var(--primary)" /> Registrar Nuevo Repartidor / Motorizado
            </h3>

            <form onSubmit={handleAddDriver} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Ramírez"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="Ej: 8888-8888"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Código PIN de Acceso</label>
                <input
                  type="text"
                  placeholder="Ej: 8492 (o automático)"
                  value={newDriverPin}
                  onChange={(e) => setNewDriverPin(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Vehículo</label>
                <select
                  value={newDriverVehicle}
                  onChange={(e) => setNewDriverVehicle(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="moto">Motocicleta</option>
                  <option value="bici">Bicicleta</option>
                  <option value="auto">Automóvil / Carro</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Placa (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: MOT-1234"
                  value={newDriverPlate}
                  onChange={(e) => setNewDriverPlate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={addingDriver}
                style={{ padding: '9px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={16} /> {addingDriver ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </div>

          {/* Drivers List */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Repartidores Activos</h3>

            {drivers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No hay repartidores registrados todavía.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {drivers.map(d => (
                  <div key={d.id} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e' }}>
                        <Bike size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {d.phone} • {d.vehicleType?.toUpperCase()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Key size={12} /> PIN: {d.accessPin || '1234'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDriver(d.id)}
                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WHATSAPP NOTIFICATION TEMPLATES */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', backgroundColor: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={22} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Plantillas de Mensajes de WhatsApp</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Personaliza los textos que se envían automáticamente a clientes y repartidores
                </p>
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '0.8rem', marginBottom: '20px' }}>
              <strong>Variables disponibles para usar en tus textos:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontFamily: 'monospace' }}>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{cliente}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{pedido}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{total}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{tienda}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{repartidor}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{direccion}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{telefono}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{productos}'}</span>
                <span style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c4b5fd' }}>{'{cobro}'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* 1. Order Received (Customer) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  1. Notificación de Pedido Recibido (Al Cliente)
                </label>
                <textarea
                  rows={4}
                  value={notificationTemplates.orderReceived || ''}
                  onChange={(e) => setNotificationTemplates({ ...notificationTemplates, orderReceived: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* 2. Order In Transit (Customer) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  2. Notificación de Pedido en Camino (Al Cliente)
                </label>
                <textarea
                  rows={4}
                  value={notificationTemplates.orderInTransit || ''}
                  onChange={(e) => setNotificationTemplates({ ...notificationTemplates, orderInTransit: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* 3. Order Delivered (Customer) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  3. Notificación de Pedido Entregado con Éxito (Al Cliente)
                </label>
                <textarea
                  rows={4}
                  value={notificationTemplates.orderDelivered || ''}
                  onChange={(e) => setNotificationTemplates({ ...notificationTemplates, orderDelivered: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* 4. Driver Dispatch */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  4. Comanda de Despacho Asignada (Al Motorizado / Repartidor)
                </label>
                <textarea
                  rows={6}
                  value={notificationTemplates.driverDispatch || ''}
                  onChange={(e) => setNotificationTemplates({ ...notificationTemplates, driverDispatch: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DESIGN & BRANDING */}
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
