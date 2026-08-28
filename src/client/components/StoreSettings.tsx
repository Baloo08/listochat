import React, { useState, useEffect } from 'react';
import { Store, Palette, Link as LinkIcon, Copy, ExternalLink, Save, CheckCircle, Upload, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { StoreSettings as StoreSettingsType, StoreTheme } from '../../shared/types';

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'design'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState(false);

  // Form Fields
  const [storeEnabled, setStoreEnabled] = useState(true);
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

  // Design & Theme Fields
  const [primaryColor, setPrimaryColor] = useState('#16a34a');
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [cardRadius, setCardRadius] = useState<'square' | 'rounded' | 'pill'>('rounded');
  const [cardShadow, setCardShadow] = useState<'none' | 'sm' | 'md' | 'lg'>('md');
  const [fontFamily, setFontFamily] = useState<'Inter' | 'Poppins' | 'Roboto' | 'Montserrat' | 'Playfair Display'>('Inter');

  const api = useApi();

  const COLOR_PRESETS = [
    { name: 'Esmeralda', hex: '#16a34a' },
    { name: 'Azul Real', hex: '#2563eb' },
    { name: 'Índigo', hex: '#4f46e5' },
    { name: 'Violeta', hex: '#7c3aed' },
    { name: 'Rojo Carmesí', hex: '#e11d48' },
    { name: 'Naranja Cítrico', hex: '#ea580c' },
    { name: 'Ámbar Dorado', hex: '#d97706' },
    { name: 'Negro Carbón', hex: '#0f172a' }
  ];

  const BG_PRESETS = [
    { name: 'Gris Moderno', hex: '#f8fafc' },
    { name: 'Blanco Puro', hex: '#ffffff' },
    { name: 'Cálido Crema', hex: '#fffbeb' },
    { name: 'Azul Suave', hex: '#f0f9ff' },
    { name: 'Oscuro Noche', hex: '#0f172a' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/api/store');
        if (data) {
          setStoreEnabled(data.storeEnabled !== false);
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
    <div style={{ maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración de Tienda Online</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Personaliza el diseño, métodos de pago y catálogo público de tu tienda en Betico
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
          <CheckCircle size={18} /> ¡Configuración y diseño guardados exitosamente!
        </div>
      )}

      {/* Public Store Link Card */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={20} color="#166534" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Enlace Público de tu Tienda</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#14532d', wordBreak: 'break-all' }}>{storeUrl}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyStoreLink}
            style={{ padding: '8px 14px', backgroundColor: 'white', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#166534' }}
          >
            <Copy size={15} /> {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 14px', backgroundColor: '#16a34a', color: 'white', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <ExternalLink size={15} /> Ver Tienda
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '25px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Store size={18} /> General y Pagos
        </button>

        <button
          onClick={() => setActiveTab('design')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'design' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'design' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Palette size={18} /> 🎨 Diseño y Personalización Visual
        </button>
      </div>

      {/* TAB 1: GENERAL & PAYMENTS */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* General Information Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Información Básica</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Nombre de la Tienda</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej: Betico Store"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Slug / Identificador URL</label>
                <input
                  type="text"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Ej: mitienda"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>Solo letras y números sin espacios (ej: demo, miburger, clinica).</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Descripción de la Tienda</label>
                <textarea
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Breve presentación de tus productos..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Métodos de Cobro y Pagos</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SINPE */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer', marginBottom: acceptSinpe ? '12px' : '0' }}>
                  <input type="checkbox" checked={acceptSinpe} onChange={(e) => setAcceptSinpe(e.target.checked)} />
                  <span>Aceptar pagos por SINPE Móvil</span>
                </label>

                {acceptSinpe && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Teléfono SINPE (ej: 8888-8888)"
                      value={sinpePhone}
                      onChange={(e) => setSinpePhone(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Nombre del Titular"
                      value={sinpeName}
                      onChange={(e) => setSinpeName(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Transfer */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer', marginBottom: acceptTransfer ? '10px' : '0' }}>
                  <input type="checkbox" checked={acceptTransfer} onChange={(e) => setAcceptTransfer(e.target.checked)} />
                  <span>Aceptar Transferencia Bancaria (IBAN)</span>
                </label>

                {acceptTransfer && (
                  <textarea
                    rows={2}
                    placeholder="Banco, Cuenta IBAN, Cédula / Razón Social..."
                    value={bankAccountInfo}
                    onChange={(e) => setBankAccountInfo(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                )}
              </div>

              {/* Delivery Options */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={deliveryEnabled} onChange={(e) => setDeliveryEnabled(e.target.checked)} />
                    <span>Habilitar Envíos a Domicilio</span>
                  </label>

                  {deliveryEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '25px' }}>
                      <span style={{ fontSize: '0.85rem' }}>Tarifa de Envío estándar (₡):</span>
                      <input
                        type="number"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                        style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={pickupEnabled} onChange={(e) => setPickupEnabled(e.target.checked)} />
                    <span>Permitir Retiro en Tienda / Local (Gratis)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DESIGN & VISUAL CUSTOMIZATION */}
      {activeTab === 'design' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
          
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Branding Images */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>Imágenes de Marca</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>URL de Banner Superior</label>
                  <input
                    type="url"
                    placeholder="https://.../banner.jpg"
                    value={storeBannerUrl}
                    onChange={(e) => setStoreBannerUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>URL del Logo de la Tienda</label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={storeLogoUrl}
                    onChange={(e) => setStoreLogoUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>Paleta de Colores</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Primary Color */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Color Primario (Botones y Acentos)</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setPrimaryColor(c.hex)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: primaryColor === c.hex ? '3px solid #000' : '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '100%', height: '36px', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Color de Fondo de la Tienda</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {BG_PRESETS.map(b => (
                      <button
                        key={b.hex}
                        type="button"
                        onClick={() => setBackgroundColor(b.hex)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: b.hex,
                          color: b.hex === '#0f172a' ? 'white' : '#1e293b',
                          border: backgroundColor === b.hex ? `2px solid ${primaryColor}` : '1px solid #cbd5e1',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Typography & Card Shapes */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>Tipografía y Estilo de Tarjetas</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Tipografía de la Tienda</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: 'white' }}
                  >
                    <option value="Inter">Inter (Moderna y Limpia)</option>
                    <option value="Poppins">Poppins (Comercial y Amigable)</option>
                    <option value="Roboto">Roboto (Clásica y Legible)</option>
                    <option value="Montserrat">Montserrat (Elegante y Vanguardista)</option>
                    <option value="Playfair Display">Playfair Display (Gourmet / Boutique)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Esquinas de las Tarjetas</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {(['square', 'rounded', 'pill'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCardRadius(r)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: cardRadius === r ? `2px solid ${primaryColor}` : '1px solid var(--border)',
                          backgroundColor: cardRadius === r ? `${primaryColor}10` : 'white',
                          color: cardRadius === r ? primaryColor : 'var(--text)',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {r === 'square' ? 'Cuadradas' : r === 'rounded' ? 'Suaves' : 'Redondeadas'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', color: primaryColor, fontWeight: 'bold', fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Previsualización en Vivo de tu Tienda
              </div>

              {/* Mock Storefront Container */}
              <div style={{ backgroundColor, padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily, minHeight: '340px' }}>
                {/* Mock Banner */}
                {storeBannerUrl ? (
                  <div style={{ height: '70px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                    <img src={storeBannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: '40px', backgroundColor: primaryColor, borderRadius: '8px', opacity: 0.8, marginBottom: '12px' }} />
                )}

                {/* Mock Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', backgroundColor: primaryColor, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      B
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: backgroundColor === '#0f172a' ? 'white' : '#1e293b' }}>
                      {storeName || 'Tu Tienda'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', backgroundColor: primaryColor, color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    🛒 1
                  </span>
                </div>

                {/* Mock Product Card */}
                <div
                  style={{
                    backgroundColor: cardBackgroundColor,
                    borderRadius: cardRadius === 'pill' ? '16px' : cardRadius === 'square' ? '4px' : '10px',
                    boxShadow: cardShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ height: '90px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                    📸 Foto del Producto
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Hamburguesa Especial</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Carne premium artesanal con queso derretido...</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: primaryColor }}>₡5,500</span>
                      <button style={{ padding: '4px 10px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
