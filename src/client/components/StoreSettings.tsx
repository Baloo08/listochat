import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { ShoppingBag, Copy, ExternalLink, Check, Save, Upload, ShieldCheck, Truck, MessageCircle } from 'lucide-react';

export default function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    storeEnabled: true,
    storeName: '',
    storeSlug: '',
    storeDescription: '',
    storeLogoUrl: '',
    storeBannerUrl: '',
    currency: 'CRC',
    acceptSinpe: true,
    sinpePhone: '',
    sinpeName: '',
    acceptTransfer: true,
    bankAccountInfo: '',
    acceptCashOnDelivery: false,
    deliveryEnabled: false,
    deliveryFee: '0',
    pickupEnabled: true,
    whatsappCheckout: true,
    minOrderAmount: '0',
    storeMessage: ''
  });

  const api = useApi();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/store');
      if (data) {
        setSettings({
          storeEnabled: data.storeEnabled !== false,
          storeName: data.storeName || '',
          storeSlug: data.storeSlug || '',
          storeDescription: data.storeDescription || '',
          storeLogoUrl: data.storeLogoUrl || '',
          storeBannerUrl: data.storeBannerUrl || '',
          currency: data.currency || 'CRC',
          acceptSinpe: data.acceptSinpe !== false,
          sinpePhone: data.sinpePhone || '',
          sinpeName: data.sinpeName || '',
          acceptTransfer: data.acceptTransfer !== false,
          bankAccountInfo: data.bankAccountInfo || '',
          acceptCashOnDelivery: data.acceptCashOnDelivery || false,
          deliveryEnabled: data.deliveryEnabled || false,
          deliveryFee: String(data.deliveryFee || '0'),
          pickupEnabled: data.pickupEnabled !== false,
          whatsappCheckout: data.whatsappCheckout !== false,
          minOrderAmount: String(data.minOrderAmount || '0'),
          storeMessage: data.storeMessage || ''
        });
      }
    } catch (err) {
      console.error('Error loading store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        deliveryFee: parseFloat(settings.deliveryFee) || 0,
        minOrderAmount: parseFloat(settings.minOrderAmount) || 0
      };
      await api.post('/api/store', payload);
      alert('¡Configuración de la tienda guardada con éxito!');
    } catch (err: any) {
      alert('Error al guardar: ' + (err.message || 'Intente de nuevo'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const form = new FormData();
    form.append('file', files[0]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (data && data.url) {
        setSettings(prev => ({ ...prev, storeLogoUrl: data.url }));
      }
    } catch (err) {
      alert('Error al subir logo');
    }
  };

  const publicStoreUrl = `${window.location.origin}/tienda/${settings.storeSlug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración de la tienda...</div>;
  }

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración de la Tienda Virtual</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Personaliza tu enlace público, métodos de pago SINPE Móvil y entregas</p>
        </div>
      </div>

      {/* Public Store Link Card */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '18px', marginBottom: '25px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={18} /> Enlace Público para Clientes y Redes Sociales
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
          Comparte este link en tu biografía de Instagram, Facebook o estado de WhatsApp para que tus clientes hagan pedidos directamente:
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            readOnly 
            value={publicStoreUrl}
            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #93c5fd', backgroundColor: 'white', fontWeight: '500', color: '#1e293b', fontSize: '0.9rem' }}
          />
          <button 
            type="button"
            onClick={copyStoreLink}
            style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado' : 'Copiar'}
          </button>
          <a 
            href={publicStoreUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ padding: '10px 16px', backgroundColor: 'white', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}
          >
            <ExternalLink size={16} /> Ver Tienda
          </a>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {/* General Store Info */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Información General de la Tienda
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
              <input 
                type="checkbox" 
                checked={settings.storeEnabled}
                onChange={e => setSettings({ ...settings, storeEnabled: e.target.checked })}
              />
              <span>Habilitar Tienda Virtual Pública</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Nombre Público de la Tienda</label>
                <input 
                  type="text" 
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Identificador / Slug</label>
                <input 
                  type="text" 
                  value={settings.storeSlug}
                  onChange={e => setSettings({ ...settings, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Descripción / Lema de la Tienda</label>
              <textarea 
                rows={2}
                placeholder="Ej: La mejor comida artesanal directo a tu puerta en minutos."
                value={settings.storeDescription}
                onChange={e => setSettings({ ...settings, storeDescription: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Logo de la Tienda</label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {settings.storeLogoUrl && (
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={settings.storeLogoUrl} alt="Store logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <label style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}>
                  <Upload size={16} /> {settings.storeLogoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Métodos de Pago
          </h3>

          {/* SINPE Móvil */}
          <div style={{ padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', color: '#166534', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                checked={settings.acceptSinpe}
                onChange={e => setSettings({ ...settings, acceptSinpe: e.target.checked })}
              />
              <span>Aceptar SINPE Móvil (Costa Rica)</span>
            </label>

            {settings.acceptSinpe && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#166534' }}>Número de Teléfono SINPE</label>
                  <input 
                    type="text" 
                    placeholder="ej: 8888-8888" 
                    value={settings.sinpePhone}
                    onChange={e => setSettings({ ...settings, sinpePhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #86efac', borderRadius: '6px', backgroundColor: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: '#166534' }}>Nombre del Titular de la Cuenta</label>
                  <input 
                    type="text" 
                    placeholder="ej: Juan Pérez Rojas" 
                    value={settings.sinpeName}
                    onChange={e => setSettings({ ...settings, sinpeName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #86efac', borderRadius: '6px', backgroundColor: 'white' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer */}
          <div style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                checked={settings.acceptTransfer}
                onChange={e => setSettings({ ...settings, acceptTransfer: e.target.checked })}
              />
              <span>Aceptar Transferencia Bancaria (IBAN)</span>
            </label>

            {settings.acceptTransfer && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Datos de la Cuenta (Banco, IBAN, Cédula)</label>
                <textarea 
                  rows={2}
                  placeholder="BAC San José · IBAN: CR05010200009999999999 · Cédula: 1-1234-5678"
                  value={settings.bankAccountInfo}
                  onChange={e => setSettings({ ...settings, bankAccountInfo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>
            )}
          </div>

          {/* Cash / Contra Entrega */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={settings.acceptCashOnDelivery}
                onChange={e => setSettings({ ...settings, acceptCashOnDelivery: e.target.checked })}
              />
              <span>Pago en efectivo contra entrega</span>
            </label>
          </div>
        </div>

        {/* Delivery & Shipping */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Envíos y Retiro
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.deliveryEnabled}
                  onChange={e => setSettings({ ...settings, deliveryEnabled: e.target.checked })}
                />
                <span>Habilitar Servicio Express / Delivery</span>
              </label>
              {settings.deliveryEnabled && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Costo del Envío (₡ CRC)</label>
                  <input 
                    type="number" 
                    placeholder="ej: 1500" 
                    value={settings.deliveryFee}
                    onChange={e => setSettings({ ...settings, deliveryFee: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={settings.pickupEnabled}
                  onChange={e => setSettings({ ...settings, pickupEnabled: e.target.checked })}
                />
                <span>Permitir Retiro en el Local / Tienda</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <Save size={18} /> {saving ? 'Guardando cambios...' : 'Guardar Configuración de la Tienda'}
          </button>
        </div>
      </form>
    </div>
  );
}
