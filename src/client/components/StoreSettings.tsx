import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Palette, Link as LinkIcon, Copy, ExternalLink, Save, CheckCircle, 
  Upload, Image as ImageIcon, Sparkles, Pipette, Info, Utensils, ShoppingBag, 
  Truck, MapPin, Package, Navigation, Users, Plus, Trash2, Phone, Bike, 
  MessageSquare, Key, HelpCircle, Edit, Send, Clock, ToggleLeft, ToggleRight, 
  Eye, Check, ShieldCheck, Box, Sliders
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { 
  StoreSettings as StoreSettingsType, StoreTheme, RestaurantConfig, 
  DeliveryConfig, DeliveryDriver, NotificationTemplates, CorreosCrConfig, 
  LocalDeliveryConfig, StoreScheduleConfig, StoreModulesConfig, CorreosCrRateBracket 
} from '../../shared/types';

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'restaurant' | 'delivery' | 'drivers' | 'templates' | 'design'>('general');
  const [shippingSubTab, setShippingSubTab] = useState<'express' | 'local' | 'correos'>('express');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState(false);

  // General & Modules Form Fields
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [storeMode, setStoreMode] = useState<'retail' | 'restaurant'>('retail');
  const [storeModules, setStoreModules] = useState<StoreModulesConfig>({
    storeEnabled: true,
    bookingsEnabled: true
  });
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBannerUrl, setStoreBannerUrl] = useState('');
  const [currency, setCurrency] = useState('CRC');

  // Payments
  const [acceptSinpe, setAcceptSinpe] = useState(true);
  const [sinpePhone, setSinpePhone] = useState('');
  const [sinpeName, setSinpeName] = useState('');
  const [acceptTransfer, setAcceptTransfer] = useState(true);
  const [bankAccountInfo, setBankAccountInfo] = useState('');
  const [acceptCashOnDelivery, setAcceptCashOnDelivery] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);

  // Store Schedule & Open/Closed Switch
  const [storeSchedule, setStoreSchedule] = useState<StoreScheduleConfig>({
    isOpenManual: true,
    autoScheduleEnabled: false,
    closedMessage: 'Actualmente nuestro local se encuentra cerrado. Puedes revisar nuestro catálogo y te atenderemos en nuestro próximo horario de apertura.',
    schedule: {
      monday: { enabled: true, open: '08:00', close: '20:00' },
      tuesday: { enabled: true, open: '08:00', close: '20:00' },
      wednesday: { enabled: true, open: '08:00', close: '20:00' },
      thursday: { enabled: true, open: '08:00', close: '20:00' },
      friday: { enabled: true, open: '08:00', close: '22:00' },
      saturday: { enabled: true, open: '09:00', close: '22:00' },
      sunday: { enabled: true, open: '09:00', close: '18:00' }
    }
  });

  // Custom Stages Nomenclature
  const [customStages, setCustomStages] = useState<Record<string, string>>({
    fase_1: 'Pedido Recibido',
    fase_2: 'En Cocina / Preparación',
    fase_3: 'Listo para Entrega',
    fase_4: 'En Camino (Delivery)',
    fase_5: 'Entregado con Éxito'
  });

  // Restaurant Mode Settings
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig>({
    allowDineIn: true,
    allowTableNumber: true,
    allowCallByName: true,
    tableCount: 15,
    allowPickup: true,
    allowDelivery: true
  });

  // 1. Moto Express Delivery (Por KM)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: 'distance',
    storeLocation: {
      lat: 9.9333,
      lng: -84.0833,
      address: 'San José, Costa Rica'
    },
    baseDeliveryFee: 1500,
    baseDeliveryKm: 3,
    feePerExtraKm: 350,
    maxDeliveryRadiusKm: 25,
    correosCrEnabled: false,
    originLocationType: 'GAM',
    correosIncludeIva: true
  });

  // 2. Local Delivery (Comercio / Paquetería Local)
  const [localDeliveryConfig, setLocalDeliveryConfig] = useState<LocalDeliveryConfig>({
    enabled: true,
    fee: 2500,
    freeAbove: 35000,
    estimatedHours: '24 a 48 horas',
    notes: 'Entregas en Gran Área Metropolitana'
  });

  // 3. Correos de Costa Rica (Tarifas Oficiales PymeExpress & EMS Editables)
  const [correosCrConfig, setCorreosCrConfig] = useState<CorreosCrConfig>({
    enabled: true,
    serviceType: 'pyme',
    originType: 'GAM',
    includeIva: true,
    rates: [
      { label: 'Pymes Liviano (0 a 500 g)', maxGrams: 500, gamPrice: 1100, restoPrice: 1350 },
      { label: 'Pymes Especial Gold (0 a 2 kg)', maxGrams: 2000, gamPrice: 1769.91, restoPrice: 2477.88 },
      { label: 'Pyme Plus (0 a 3 kg)', maxGrams: 3000, gamPrice: 2425, restoPrice: 3360 },
      { label: 'Carga Liviana (3 a 10 kg)', maxGrams: 10000, gamPrice: 3982.30, restoPrice: 3982.30 },
      { label: 'Pesado Express (10 a 20 kg)', maxGrams: 20000, gamPrice: 9800, restoPrice: 9800 },
      { label: 'Pesado Express (20 a 30 kg)', maxGrams: 30000, gamPrice: 14000, restoPrice: 14000 }
    ]
  });

  // Notification Templates
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

  // Edit Driver Modal State
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
  const [updatingDriver, setUpdatingDriver] = useState(false);
  const [copiedPinDriverId, setCopiedPinDriverId] = useState<string | null>(null);

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
          if (data.storeModules) {
            setStoreModules({
              storeEnabled: data.storeModules.storeEnabled !== false,
              bookingsEnabled: data.storeModules.bookingsEnabled !== false
            });
          }
          if (data.storeSchedule) {
            setStoreSchedule(prev => ({
              ...prev,
              ...data.storeSchedule
            }));
          }
          if (data.customStages) {
            setCustomStages(prev => ({
              ...prev,
              ...data.customStages
            }));
          }
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
              deliveryType: data.deliveryConfig.deliveryType || 'distance',
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
          if (data.localDeliveryConfig) {
            setLocalDeliveryConfig(prev => ({ ...prev, ...data.localDeliveryConfig }));
          }
          if (data.correosCrConfig) {
            setCorreosCrConfig(prev => ({ ...prev, ...data.correosCrConfig }));
          }
          if (data.notificationTemplates) {
            setNotificationTemplates(prev => ({ ...prev, ...data.notificationTemplates }));
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
      const pinToUse = (newDriverPin && newDriverPin.trim()) || Math.floor(1000 + Math.random() * 9000).toString();
      await api.post('/api/drivers', {
        name: newDriverName.trim(),
        phone: newDriverPhone.trim(),
        accessPin: pinToUse,
        vehicleType: newDriverVehicle,
        plateNumber: newDriverPlate.trim()
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

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setUpdatingDriver(true);
    try {
      await api.put(`/api/drivers/${editingDriver.id}`, {
        name: editingDriver.name,
        phone: editingDriver.phone,
        accessPin: editingDriver.accessPin,
        vehicleType: editingDriver.vehicleType,
        plateNumber: editingDriver.plateNumber,
        active: editingDriver.active
      });
      setEditingDriver(null);
      await fetchDrivers();
    } catch (e: any) {
      alert('Error actualizando repartidor: ' + e.message);
    } finally {
      setUpdatingDriver(false);
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

  const handleSendDriverWelcome = async (driver: DeliveryDriver) => {
    try {
      const res = await api.post(`/api/drivers/${driver.id}/send-welcome`, {});
      if (res?.success) {
        alert(`¡Mensaje de WhatsApp con PIN y enlace enviado a ${driver.name}!`);
      } else {
        const cleanPhone = driver.phone.replace(/\D/g, '');
        const directUrl = `${window.location.origin}/repartidor?pin=${driver.accessPin || '1234'}`;
        const waText = encodeURIComponent(`👋 ¡Hola ${driver.name}! Has sido registrado como repartidor en ${storeName || 'nuestro negocio'}.\n\n🔑 Tu PIN de acceso es: ${driver.accessPin || '1234'}\n📲 Tu portal de entregas: ${directUrl}`);
        window.open(`https://wa.me/${cleanPhone.length === 8 ? '506' + cleanPhone : cleanPhone}?text=${waText}`, '_blank');
      }
    } catch (e) {
      const cleanPhone = driver.phone.replace(/\D/g, '');
      const directUrl = `${window.location.origin}/repartidor?pin=${driver.accessPin || '1234'}`;
      const waText = encodeURIComponent(`👋 ¡Hola ${driver.name}! Has sido registrado como repartidor en ${storeName || 'nuestro negocio'}.\n\n🔑 Tu PIN de acceso es: ${driver.accessPin || '1234'}\n📲 Tu portal de entregas: ${directUrl}`);
      window.open(`https://wa.me/${cleanPhone.length === 8 ? '506' + cleanPhone : cleanPhone}?text=${waText}`, '_blank');
    }
  };

  const copyDriverPortalLink = (driver: DeliveryDriver) => {
    const directUrl = `${window.location.origin}/repartidor?pin=${driver.accessPin || '1234'}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedPinDriverId(driver.id);
    setTimeout(() => setCopiedPinDriverId(null), 2500);
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

      const cleanSlug = storeSlug ? storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : undefined;
      await api.post('/api/store', {
        storeEnabled,
        storeMode,
        storeModules,
        restaurantConfig,
        deliveryConfig,
        correosCrConfig,
        localDeliveryConfig,
        storeSchedule,
        customStages,
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
        pickupEnabled
      });
      setSaveMessage(true);
      setTimeout(() => setSaveMessage(false), 3000);
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
        storeModules,
        restaurantConfig,
        deliveryConfig,
        correosCrConfig,
        localDeliveryConfig,
        storeSchedule,
        customStages,
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

  const updateCorreosRate = (index: number, field: 'gamPrice' | 'restoPrice', val: number) => {
    const updatedRates = [...correosCrConfig.rates];
    updatedRates[index] = { ...updatedRates[index], [field]: val };
    setCorreosCrConfig({ ...correosCrConfig, rates: updatedRates });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración de la tienda...</div>;
  }

  const radiusValue = cardRadius === 'square' ? '0px' : cardRadius === 'pill' ? '24px' : '10px';
  const shadowValue = cardShadow === 'none' ? 'none' : cardShadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.08)' : cardShadow === 'lg' ? '0 10px 25px -5px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)';

  return (
    <div style={{ maxWidth: '1000px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración de Tienda, Envíos & Operación</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Control de módulos, modalidad de comandas/pedidos, cálculo de envíos, horarios y diseño visual
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 22px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
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
              {storeMode === 'restaurant' ? 'Menú Digital / Comandas de tu Restaurante' : 'Enlace Público de tu Tienda'}
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
            <ExternalLink size={15} /> Ver Menú / Tienda
          </a>
        </div>
      </div>

      {/* Tabs with Clean Lucide SVG Icons */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '25px', gap: '10px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Store size={17} /> General & Módulos
        </button>

        <button
          onClick={() => setActiveTab('restaurant')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'restaurant' ? '2px solid #ea580c' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'restaurant' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Utensils size={17} /> Modo {storeMode === 'restaurant' ? 'Restaurante & Comandas' : 'Tienda & Fases'}
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'delivery' ? '2px solid #2563eb' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'delivery' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Truck size={17} /> Envíos (Express / Domicilio / Correos CR)
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'drivers' ? '2px solid #0d9488' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'drivers' ? '#0d9488' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Bike size={17} /> Repartidores / Motorizados ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'templates' ? '2px solid #8b5cf6' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'templates' ? '#8b5cf6' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <MessageSquare size={17} /> Plantillas WhatsApp
        </button>

        <button
          onClick={() => setActiveTab('design')}
          style={{
            padding: '10px 16px', border: 'none',
            borderBottom: activeTab === 'design' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'design' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}
        >
          <Palette size={17} /> Diseño Visual & Tipografía
        </button>
      </div>

      {/* TAB 1: GENERAL, MODULE BOOLEANS & STORE SCHEDULE */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Module Booleans (Optimization) */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--primary)" /> Activación de Módulos (Optimización de Espacio)
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Activa o desactiva las funciones principales para simplificar la barra lateral según tu tipo de negocio.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ padding: '16px', borderRadius: '10px', border: `2px solid ${storeModules.storeEnabled ? 'var(--primary)' : '#e2e8f0'}`, backgroundColor: storeModules.storeEnabled ? 'rgba(22, 163, 74, 0.05)' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b' }}>Módulo de Tienda / Menú & Pedidos</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Catálogo de productos, comandas y envíos.</div>
                </div>
                <input
                  type="checkbox"
                  checked={storeModules.storeEnabled}
                  onChange={(e) => setStoreModules({ ...storeModules, storeEnabled: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </label>

              <label style={{ padding: '16px', borderRadius: '10px', border: `2px solid ${storeModules.bookingsEnabled ? '#2563eb' : '#e2e8f0'}`, backgroundColor: storeModules.bookingsEnabled ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b' }}>Módulo de Reservas & Citas</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Agenda online, servicios y cupos de atención.</div>
                </div>
                <input
                  type="checkbox"
                  checked={storeModules.bookingsEnabled}
                  onChange={(e) => setStoreModules({ ...storeModules, bookingsEnabled: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Master Open / Closed Switch & Orders Schedule */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: storeSchedule.isOpenManual ? '#dcfce7' : '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: storeSchedule.isOpenManual ? '#166534' : '#b91c1c' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Recepción de Pedidos (Abierto / Cerrado)</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Control de apertura para admitir o pausar la recepción de pedidos en la tienda y WhatsApp
                  </p>
                </div>
              </div>

              {/* Master Open/Close Switch */}
              <button
                type="button"
                onClick={() => setStoreSchedule({ ...storeSchedule, isOpenManual: !storeSchedule.isOpenManual })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: storeSchedule.isOpenManual ? '#16a34a' : '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {storeSchedule.isOpenManual ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                <span>{storeSchedule.isOpenManual ? 'LOCAL ABIERTO (Recibiendo Pedidos)' : 'LOCAL CERRADO (Pedidos Pausados)'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Mensaje a Mostrar al Cliente si el Local está Cerrado:
                </label>
                <textarea
                  rows={2}
                  value={storeSchedule.closedMessage || ''}
                  onChange={(e) => setStoreSchedule({ ...storeSchedule, closedMessage: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Modalidad de Operación */}
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
                  Gestión orientada a <strong>Pedidos</strong>, compras en línea y paquetería.
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
                  Gestión orientada a <strong>Comandas</strong>, rotulación de mesa, llamado por nombre y KDS de cocina.
                </p>
              </div>
            </div>
          </div>

          {/* Información Básica */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Información Básica del Negocio</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Nombre Comercial</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej: Betico Express o Restaurante La Casona"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Identificador URL (Slug)</label>
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
                  placeholder="Ej: Deliciosos platillos preparados al momento..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESTAURANT CONFIG & EDITABLE STAGES */}
      {activeTab === 'restaurant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Editable Stages Nomenclature */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>
              Personalización de Fases ({storeMode === 'restaurant' ? 'Comandas de Cocina' : 'Pedidos de Tienda'})
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Edita el nombre visible de cada etapa según la operación de tu negocio.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '3px' }}>Fase 1 (Inicial)</label>
                <input
                  type="text"
                  value={customStages.fase_1 || ''}
                  onChange={(e) => setCustomStages({ ...customStages, fase_1: e.target.value })}
                  placeholder="Ej: Pedido Recibido"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '3px' }}>Fase 2 (En Proceso)</label>
                <input
                  type="text"
                  value={customStages.fase_2 || ''}
                  onChange={(e) => setCustomStages({ ...customStages, fase_2: e.target.value })}
                  placeholder="Ej: En Cocina"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '3px' }}>Fase 3 (Listo)</label>
                <input
                  type="text"
                  value={customStages.fase_3 || ''}
                  onChange={(e) => setCustomStages({ ...customStages, fase_3: e.target.value })}
                  placeholder="Ej: Listo para Retiro"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0284c7', marginBottom: '3px' }}>Fase 4 (Despacho)</label>
                <input
                  type="text"
                  value={customStages.fase_4 || ''}
                  onChange={(e) => setCustomStages({ ...customStages, fase_4: e.target.value })}
                  placeholder="Ej: En Camino"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '3px' }}>Fase 5 (Final)</label>
                <input
                  type="text"
                  value={customStages.fase_5 || ''}
                  onChange={(e) => setCustomStages({ ...customStages, fase_5: e.target.value })}
                  placeholder="Ej: Entregado con Éxito"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Restaurant vs Retail Modes */}
          {storeMode === 'restaurant' ? (
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#ffedd5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={22} color="#ea580c" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Modalidades de Comanda en Restaurante</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Personaliza cómo los clientes ordenan en mesa, barra o express
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
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={22} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Modalidades de Entrega en Tienda Minorista</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Configura las opciones de despacho para clientes de tu tienda o catálogo comercial
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={pickupEnabled}
                      onChange={(e) => setPickupEnabled(e.target.checked)}
                    />
                    <span>Permitir Retiro en Sucursal / Tienda Física (Pick-up)</span>
                  </label>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={deliveryConfig.correosCrEnabled}
                      onChange={(e) => setDeliveryConfig({ ...deliveryConfig, correosCrEnabled: e.target.checked })}
                    />
                    <span>Habilitar Despachos por Paquetería / Correos de Costa Rica</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 3 INDEPENDENT SHIPPING METHODS */}
      {activeTab === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sub-tabs for the 3 shipping types */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '10px' }}>
            <button
              onClick={() => setShippingSubTab('express')}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: shippingSubTab === 'express' ? '#ffffff' : 'transparent',
                color: shippingSubTab === 'express' ? '#ea580c' : '#64748b',
                boxShadow: shippingSubTab === 'express' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Bike size={16} /> 1. Delivery Express (Moto / KM)
            </button>

            <button
              onClick={() => setShippingSubTab('local')}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: shippingSubTab === 'local' ? '#ffffff' : 'transparent',
                color: shippingSubTab === 'local' ? '#2563eb' : '#64748b',
                boxShadow: shippingSubTab === 'local' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Truck size={16} /> 2. Entrega a Domicilio Estándar
            </button>

            {storeMode !== 'restaurant' && (
              <button
                onClick={() => setShippingSubTab('correos')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                  backgroundColor: shippingSubTab === 'correos' ? '#ffffff' : 'transparent',
                  color: shippingSubTab === 'correos' ? '#0d9488' : '#64748b',
                  boxShadow: shippingSubTab === 'correos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Box size={16} /> 3. Correos de Costa Rica (EMS / Pyme)
              </button>
            )}
          </div>

          {/* 1. MOTO EXPRESS DELIVERY CONFIG */}
          {shippingSubTab === 'express' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <MapPin size={22} color="#ea580c" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Punto de Origen GPS del Local</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Coordenadas exactas para calcular los kilómetros de distancia hasta la ubicación del cliente
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Dirección Física del Local</label>
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
                        type="number" step="any"
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
                        type="number" step="any"
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
                      style={{ padding: '8px 14px', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
                    >
                      <Navigation size={14} /> {fetchingStoreGps ? 'Capturando...' : 'Capturar GPS'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Tarifas de Delivery por Kilómetro</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Tarifa Base de Salida (₡)</label>
                    <input
                      type="number"
                      value={deliveryConfig.baseDeliveryFee}
                      onChange={(e) => setDeliveryConfig({ ...deliveryConfig, baseDeliveryFee: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Costo mínimo de entrega</span>
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
              </div>
            </div>
          )}

          {/* 2. LOCAL STANDARD DELIVERY CONFIG */}
          {shippingSubTab === 'local' && (
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={22} color="#2563eb" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Entrega a Domicilio Estándar (Comercio / Paquetería)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Envíos con mensajería fija o rutas programadas
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localDeliveryConfig.enabled}
                    onChange={(e) => setLocalDeliveryConfig({ ...localDeliveryConfig, enabled: e.target.checked })}
                  />
                  <span>Habilitar</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Costo de Envío Fijo (₡)</label>
                  <input
                    type="number"
                    value={localDeliveryConfig.fee}
                    onChange={(e) => setLocalDeliveryConfig({ ...localDeliveryConfig, fee: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Envío Gratis a partir de (₡)</label>
                  <input
                    type="number"
                    value={localDeliveryConfig.freeAbove || 0}
                    onChange={(e) => setLocalDeliveryConfig({ ...localDeliveryConfig, freeAbove: Number(e.target.value) })}
                    placeholder="Ej: 35000 (0 para desactivar)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Tiempo Estimado de Entrega</label>
                  <input
                    type="text"
                    value={localDeliveryConfig.estimatedHours || ''}
                    onChange={(e) => setLocalDeliveryConfig({ ...localDeliveryConfig, estimatedHours: e.target.value })}
                    placeholder="Ej: 24 a 48 horas"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. CORREOS DE COSTA RICA (EMS & PYMEEXPRESS CON TARIFAS EDITABLES) */}
          {shippingSubTab === 'correos' && (
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box size={22} color="#0d9488" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Correos de Costa Rica (Tarifas Editables)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Envíos nacionales con EMS Courier o PymeExpress. Puedes ajustar las tarifas según tus convenios.
                    </p>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={correosCrConfig.enabled}
                    onChange={(e) => setCorreosCrConfig({ ...correosCrConfig, enabled: e.target.checked })}
                  />
                  <span>Habilitar Correos CR</span>
                </label>
              </div>

              {/* Service Type & Origin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', marginBottom: '18px', backgroundColor: '#f0fdfa', padding: '14px', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>Tipo de Servicio</label>
                  <select
                    value={correosCrConfig.serviceType}
                    onChange={(e) => setCorreosCrConfig({ ...correosCrConfig, serviceType: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #99f6e4', fontSize: '0.85rem', backgroundColor: 'white' }}
                  >
                    <option value="ems">EMS Courier Nacional (Rápido / Prioritario)</option>
                    <option value="pyme">PymeExpress (Tarifa Preferencial Emprendedor)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>Ubicación de Origen del Negocio</label>
                  <select
                    value={correosCrConfig.originType}
                    onChange={(e) => setCorreosCrConfig({ ...correosCrConfig, originType: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #99f6e4', fontSize: '0.85rem', backgroundColor: 'white' }}
                  >
                    <option value="GAM">Gran Área Metropolitana (GAM)</option>
                    <option value="RESTO">Fuera de GAM / Resto del País</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f766e', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={correosCrConfig.includeIva}
                      onChange={(e) => setCorreosCrConfig({ ...correosCrConfig, includeIva: e.target.checked })}
                    />
                    <span>Incluir IVA (13%)</span>
                  </label>
                </div>
              </div>

              {/* Editable Rate Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '10px 14px' }}>Rango / Tramo de Peso</th>
                      <th style={{ padding: '10px 14px' }}>Tarifa Dentro de GAM (₡)</th>
                      <th style={{ padding: '10px 14px' }}>Tarifa Resto del País (₡)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correosCrConfig.rates.map((bracket, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 'bold' }}>{bracket.label}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            value={bracket.gamPrice}
                            onChange={(e) => updateCorreosRate(idx, 'gamPrice', Number(e.target.value))}
                            style={{ width: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            value={bracket.restoPrice}
                            onChange={(e) => updateCorreosRate(idx, 'restoPrice', Number(e.target.value))}
                            style={{ width: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {drivers.map(d => {
                  const driverPortalUrl = `${window.location.origin}/repartidor?pin=${d.accessPin || '1234'}`;
                  return (
                    <div key={d.id} style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '42px', height: '42px', backgroundColor: '#ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e' }}>
                            <Bike size={22} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{d.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 {d.phone} • {d.vehicleType?.toUpperCase()} {d.plateNumber ? `(${d.plateNumber})` : ''}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => setEditingDriver(d)}
                            style={{ border: 'none', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            title="Editar repartidor"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(d.id)}
                            style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                            title="Eliminar repartidor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '8px 12px', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#0f766e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Key size={14} /> PIN de Acceso: <strong>{d.accessPin || '1234'}</strong>
                        </span>
                        <button
                          onClick={() => copyDriverPortalLink(d)}
                          style={{ padding: '4px 8px', backgroundColor: 'white', border: '1px solid #99f6e4', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Copy size={12} /> {copiedPinDriverId === d.id ? '¡Copiado!' : 'Copiar Enlace'}
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          onClick={() => handleSendDriverWelcome(d)}
                          style={{ padding: '8px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Send size={13} /> WhatsApp PIN
                        </button>

                        <a
                          href={driverPortalUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '8px', backgroundColor: '#0f172a', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={13} /> Abrir Portal
                        </a>
                      </div>
                    </div>
                  );
                })}
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

      {/* TAB 6: DESIGN, TYPOGRAPHY & LIVE PREVIEW */}
      {activeTab === 'design' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Logo & Banner Upload */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Logo y Banner de Portada</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Logo del Negocio (512x512)</label>
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
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Banner de Portada (1200x400)</label>
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
                    {uploadingBanner ? 'Subiendo...' : 'Subir Banner'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Typography, Colors, Radius & Shadows Controls + LIVE PREVIEW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            
            {/* Left: Design Form Controls */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Estilo Visual & Tipografía</h3>

              {/* Typography Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Tipografía (Fuente)</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="Inter">Inter (Moderna, Limpia, Legible)</option>
                  <option value="Poppins">Poppins (Geométrica, Dinámica)</option>
                  <option value="Roboto">Roboto (Clásica, Estructurada)</option>
                  <option value="Montserrat">Montserrat (Elegante, Negocios)</option>
                  <option value="Playfair Display">Playfair Display (Premium, Gourmet)</option>
                </select>
              </div>

              {/* Colors */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Color Primario de Marca</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {COLOR_PRESETS.map(c => (
                    <div
                      key={c.hex}
                      onClick={() => setPrimaryColor(c.hex)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
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
                    style={{ width: '38px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Card Radius */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Curvatura de Tarjetas (Cards)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCardRadius('square')}
                    style={{ padding: '8px', borderRadius: '0px', border: `2px solid ${cardRadius === 'square' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardRadius === 'square' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Cuadrado (0px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardRadius('rounded')}
                    style={{ padding: '8px', borderRadius: '8px', border: `2px solid ${cardRadius === 'rounded' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardRadius === 'rounded' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Redondeado (8px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardRadius('pill')}
                    style={{ padding: '8px', borderRadius: '20px', border: `2px solid ${cardRadius === 'pill' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardRadius === 'pill' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Píldora (24px)
                  </button>
                </div>
              </div>

              {/* Card Shadows */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Sombra de Tarjetas</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCardShadow('none')}
                    style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${cardShadow === 'none' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardShadow === 'none' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    Sin Sombra
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardShadow('sm')}
                    style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${cardShadow === 'sm' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardShadow === 'sm' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    Suave
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardShadow('md')}
                    style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${cardShadow === 'md' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardShadow === 'md' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardShadow('lg')}
                    style={{ padding: '6px', borderRadius: '6px', border: `1px solid ${cardShadow === 'lg' ? primaryColor : '#cbd5e1'}`, backgroundColor: cardShadow === 'lg' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    Elevada
                  </button>
                </div>
              </div>
            </div>

            {/* Right: LIVE PREVIEW OF CARDS */}
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>
                <Eye size={18} color="var(--primary)" /> Previsualización en Vivo de tu Catálogo
              </div>

              <div
                style={{
                  fontFamily: fontFamily,
                  backgroundColor: cardBackgroundColor,
                  borderRadius: radiusValue,
                  boxShadow: shadowValue,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Sample Card Image */}
                <div style={{ height: '140px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={36} />
                </div>

                {/* Sample Card Content */}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Platillo / Producto Estrella
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}>
                    Pizza Especial de la Casa
                  </h4>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Ingredientes frescos seleccionados con salsa artesanal y queso mozzarella.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: primaryColor }}>
                      ₡8.500
                    </span>

                    <button
                      type="button"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: primaryColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: radiusValue,
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {editingDriver && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="var(--primary)" /> Editar Perfil del Repartidor
              </h3>
              <button onClick={() => setEditingDriver(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={editingDriver.name}
                  onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Teléfono WhatsApp</label>
                <input
                  type="tel"
                  value={editingDriver.phone}
                  onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Código PIN de Acceso</label>
                <input
                  type="text"
                  value={editingDriver.accessPin || '1234'}
                  onChange={(e) => setEditingDriver({ ...editingDriver, accessPin: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 'bold', color: '#0f766e' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Vehículo</label>
                  <select
                    value={editingDriver.vehicleType || 'moto'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, vehicleType: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="moto">Motocicleta</option>
                    <option value="bici">Bicicleta</option>
                    <option value="auto">Automóvil / Carro</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Placa</label>
                  <input
                    type="text"
                    value={editingDriver.plateNumber || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, plateNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingDriver}
                  style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  {updatingDriver ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
