import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import {
  Globe,
  Palette,
  Layout,
  FileText,
  Sparkles,
  MessageSquare,
  Share2,
  ExternalLink,
  Save,
  Upload,
  Plus,
  Trash2,
  Check,
  Eye,
  ShoppingBag,
  Calendar,
  Smartphone,
  Monitor,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  ToggleLeft,
  ToggleRight,
  Package,
  Wrench
} from 'lucide-react';

interface FeatureItem {
  title: string;
  desc: string;
}

interface TestimonialItem {
  name: string;
  comment: string;
  rating?: number;
}

interface WebsiteConfig {
  id?: string;
  tenantId?: string;
  websiteEnabled: boolean;
  headline: string;
  subheadline: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl?: string;
  bannerImageUrl?: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  showStoreButton: boolean;
  showBookingButton: boolean;
  storeButtonText: string;
  bookingButtonText: string;
  showAboutSection: boolean;
  showFeaturesSection: boolean;
  showProductsSection: boolean;
  showServicesSection: boolean;
  showTestimonialsSection: boolean;
  showContactSection: boolean;
  featuresJson: FeatureItem[];
  testimonialsJson: TestimonialItem[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
}

export default function WebsiteBuilder() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'branding' | 'about' | 'features' | 'products' | 'services' | 'testimonials' | 'contact' | 'preview'>('hero');
  const [copied, setCopied] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<WebsiteConfig>({
    websiteEnabled: true,
    headline: 'Bienvenido a nuestro sitio oficial',
    subheadline: 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
    aboutTitle: 'Conoce Nuestra Historia',
    aboutText: 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría. Nuestro compromiso es tu satisfacción total.',
    primaryColor: '#2563eb',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    showStoreButton: true,
    showBookingButton: true,
    storeButtonText: 'Ver Menú y Productos',
    bookingButtonText: 'Agendar Cita en Línea',
    showAboutSection: true,
    showFeaturesSection: true,
    showProductsSection: true,
    showServicesSection: true,
    showTestimonialsSection: true,
    showContactSection: true,
    featuresJson: [
      { title: 'Calidad Garantizada', desc: 'Productos y servicios seleccionados con los más altos estándares.' },
      { title: 'Atención Rápida', desc: 'Respuestas y pedidos inmediatos con asistencia 24/7.' },
      { title: 'Pagos Seguros', desc: 'Aceptamos SINPE Móvil, transferencias y tarjetas.' }
    ],
    testimonialsJson: [
      { name: 'Cliente Satisfecho', comment: '¡Excelente servicio y atención rápida! 100% recomendado.', rating: 5 }
    ]
  });

  useEffect(() => {
    loadWebsiteSettings();
  }, []);

  const loadWebsiteSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/website');
      if (res) {
        setFormData(prev => ({
          ...prev,
          ...res,
          showAboutSection: res.showAboutSection !== false,
          showFeaturesSection: res.showFeaturesSection !== false,
          showProductsSection: res.showProductsSection !== false,
          showServicesSection: res.showServicesSection !== false,
          showTestimonialsSection: res.showTestimonialsSection !== false,
          showContactSection: res.showContactSection !== false,
          featuresJson: Array.isArray(res.featuresJson) && res.featuresJson.length > 0 ? res.featuresJson : prev.featuresJson,
          testimonialsJson: Array.isArray(res.testimonialsJson) && res.testimonialsJson.length > 0 ? res.testimonialsJson : prev.testimonialsJson
        }));
      }

      // Fetch tenant info for slug
      const meRes = await api.get('/api/auth/me');
      if (meRes && meRes.tenantSlug) {
        setTenantSlug(meRes.tenantSlug);
      }
    } catch (error) {
      console.error('Error loading website settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/api/website', formData);
      alert('¡Sitio web guardado y actualizado con éxito!');
    } catch (error: any) {
      alert('Error al guardar sitio web: ' + (error.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'bannerImageUrl' | 'aboutImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setFormData(prev => ({ ...prev, [fieldName]: data.url }));
      }
    } catch (err) {
      alert('Error al subir imagen');
    }
  };

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/sitio/${tenantSlug || 'demo'}`
    : `/sitio/${tenantSlug || 'demo'}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helpers for array features
  const handleFeatureChange = (index: number, key: 'title' | 'desc', val: string) => {
    const updated = [...formData.featuresJson];
    updated[index][key] = val;
    setFormData(prev => ({ ...prev, featuresJson: updated }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      featuresJson: [...prev.featuresJson, { title: 'Nuevo Beneficio', desc: 'Descripción del beneficio que ofreces.' }]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      featuresJson: prev.featuresJson.filter((_, i) => i !== index)
    }));
  };

  // Helpers for testimonials
  const handleTestimonialChange = (index: number, key: 'name' | 'comment', val: string) => {
    const updated = [...formData.testimonialsJson];
    updated[index][key] = val;
    setFormData(prev => ({ ...prev, testimonialsJson: updated }));
  };

  const addTestimonial = () => {
    setFormData(prev => ({
      ...prev,
      testimonialsJson: [...prev.testimonialsJson, { name: 'Nombre del Cliente', comment: 'Comentario u opinión positiva.', rating: 5 }]
    }));
  };

  const removeTestimonial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testimonialsJson: prev.testimonialsJson.filter((_, i) => i !== index)
    }));
  };

  // Section Toggle Component
  const SectionToggle = ({ title, active, onToggle }: { title: string; active: boolean; onToggle: () => void }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: active ? '#f0fdf4' : '#f8fafc',
      border: active ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '16px'
    }}>
      <div>
        <strong style={{ fontSize: '0.92rem', color: active ? '#166534' : '#64748b' }}>
          {title}
        </strong>
        <p style={{ margin: 0, fontSize: '0.78rem', color: active ? '#15803d' : '#94a3b8' }}>
          {active ? '🟢 Esta sección está visible en tu página web pública' : '⚪ Esta sección está oculta en tu página web pública'}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: active ? '#16a34a' : '#cbd5e1',
          color: 'white',
          fontWeight: '700',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {active ? 'Activada' : 'Desactivada'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <p>Cargando editor del sitio web...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Globe size={20} color="#2563eb" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Creador de Sitio Web Oficial
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
            Personaliza las secciones, activa o desactiva bloques y comparte tu enlace web oficial.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={copyPublicLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '8px',
              backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1',
              fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} color="#16a34a" /> : <Share2 size={16} />}
            {copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '8px',
              backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
              fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none'
            }}
          >
            <ExternalLink size={16} /> Ver Web
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '8px',
              backgroundColor: '#2563eb', color: 'white', border: 'none',
              fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px'
      }}>
        {[
          { id: 'hero', label: 'Portada (Hero)', icon: <Layout size={16} /> },
          { id: 'branding', label: 'Marca & Colores', icon: <Palette size={16} /> },
          { id: 'about', label: 'Sobre Nosotros', icon: <FileText size={16} /> },
          { id: 'features', label: 'Beneficios', icon: <Sparkles size={16} /> },
          { id: 'products', label: 'Menú & Productos', icon: <Package size={16} /> },
          { id: 'services', label: 'Servicios', icon: <Wrench size={16} /> },
          { id: 'testimonials', label: 'Testimonios', icon: <MessageSquare size={16} /> },
          { id: 'contact', label: 'Contacto & Redes', icon: <Phone size={16} /> },
          { id: 'preview', label: 'Vista Previa en Vivo', icon: <Eye size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: activeTab === t.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: activeTab === t.id ? '#2563eb' : '#ffffff',
              color: activeTab === t.id ? '#ffffff' : '#475569',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        minHeight: '450px'
      }}>

        {/* 1. PORTADA / HERO */}
        {activeTab === 'hero' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
              Portada Principal del Sitio Web
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Título Principal (Headline)
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Ej: Bienvenido a la mejor experiencia gastronómica de San José"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '0.9rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Subtítulo o Descripción de Bienvenida
              </label>
              <textarea
                rows={3}
                value={formData.subheadline}
                onChange={e => setFormData({ ...formData, subheadline: e.target.value })}
                placeholder="Ej: Disfruta de deliciosos platillos preparados al momento, con pedidos rápidos por WhatsApp y entregas express."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit'
                }}
              />
            </div>

            {/* BOTONES DE ACCIÓN PRINCIPALES */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                🔘 Botones Principales de Llamado a la Acción (CTA)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                
                {/* Botón Tienda */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.88rem' }}>
                      <ShoppingBag size={18} color="#2563eb" /> Botón de Tienda / Menú
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.showStoreButton}
                        onChange={e => setFormData({ ...formData, showStoreButton: e.target.checked })}
                      /> Activo
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!formData.showStoreButton}
                    value={formData.storeButtonText}
                    onChange={e => setFormData({ ...formData, storeButtonText: e.target.value })}
                    placeholder="Texto del botón (ej: Ver Menú y Productos)"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                      fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                    Vinculado automáticamente a: <code>/tienda/{tenantSlug}</code>
                  </div>
                </div>

                {/* Botón Reservas */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.88rem' }}>
                      <Calendar size={18} color="#a855f7" /> Botón de Citas / Agenda
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.showBookingButton}
                        onChange={e => setFormData({ ...formData, showBookingButton: e.target.checked })}
                      /> Activo
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!formData.showBookingButton}
                    value={formData.bookingButtonText}
                    onChange={e => setFormData({ ...formData, bookingButtonText: e.target.value })}
                    placeholder="Texto del botón (ej: Agendar Cita en Línea)"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                      fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                    Vinculado automáticamente a: <code>/reservas/{tenantSlug}</code>
                  </div>
                </div>

              </div>
            </div>

            {/* Banner de Fondo */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Imagen de Portada / Banner (Opcional)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {formData.bannerImageUrl && (
                  <img
                    src={formData.bannerImageUrl}
                    alt="Banner"
                    style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                )}
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={e => handleImageUpload(e, 'bannerImageUrl')}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Upload size={15} /> Subir Imagen de Portada
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 2. MARCA & COLORES */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
              Identidad Visual y Marca
            </h3>

            {/* LOGOTIPO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Logotipo del Negocio
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '4px' }}
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Logo
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={e => handleImageUpload(e, 'logoUrl')}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Upload size={15} /> Cambiar Logo
                </button>
              </div>
            </div>

            {/* PALETA DE COLORES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Color Primario (Botones y Encabezados)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ width: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Color de Acento (Detalles y Badges)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                    style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                    style={{ width: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* TIPOGRAFÍA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Tipografía del Sitio Web
              </label>
              <select
                value={formData.fontFamily}
                onChange={e => setFormData({ ...formData, fontFamily: e.target.value })}
                style={{ width: '100%', maxWidth: '300px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="Inter">Inter (Moderna y Limpia)</option>
                <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Tecnológica y Elegante)</option>
                <option value="Poppins, sans-serif">Poppins (Geométrica y Amigable)</option>
                <option value="Roboto, sans-serif">Roboto (Clásica y Legible)</option>
                <option value="'Playfair Display', serif">Playfair Display (Premium / Sofisticada)</option>
                <option value="Outfit, sans-serif">Outfit (Minimalista)</option>
              </select>
            </div>

          </div>
        )}

        {/* 3. SOBRE NOSOTROS */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Sobre Nosotros"'
              active={formData.showAboutSection}
              onToggle={() => setFormData({ ...formData, showAboutSection: !formData.showAboutSection })}
            />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Título de la Sección
              </label>
              <input
                type="text"
                value={formData.aboutTitle}
                onChange={e => setFormData({ ...formData, aboutTitle: e.target.value })}
                placeholder="Ej: Nuestra Historia & Filosofía"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Texto o Historia del Negocio
              </label>
              <textarea
                rows={5}
                value={formData.aboutText}
                onChange={e => setFormData({ ...formData, aboutText: e.target.value })}
                placeholder="Cuenta brevemente a tus clientes quiénes son, cuántos años de experiencia tienen y qué los hace especiales..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Foto de la Sección (Local, Equipo o Producto estrella)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {formData.aboutImageUrl && (
                  <img
                    src={formData.aboutImageUrl}
                    alt="About"
                    style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                )}
                <input
                  type="file"
                  ref={aboutImageInputRef}
                  onChange={e => handleImageUpload(e, 'aboutImageUrl')}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => aboutImageInputRef.current?.click()}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Upload size={15} /> Subir Foto de la Empresa
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 4. BENEFICIOS / FEATURES */}
        {activeTab === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Beneficios y Puntos Clave"'
              active={formData.showFeaturesSection}
              onToggle={() => setFormData({ ...formData, showFeaturesSection: !formData.showFeaturesSection })}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
                  Tarjetas de Beneficios
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
                  Explica por qué tus clientes deben elegir tu negocio.
                </p>
              </div>
              <button
                type="button"
                onClick={addFeature}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                  fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Añadir Beneficio
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.featuresJson.map((feat, idx) => (
                <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Beneficio #{idx + 1}</strong>
                    {formData.featuresJson.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={e => handleFeatureChange(idx, 'title', e.target.value)}
                    placeholder="Título del beneficio (ej: Envíos en menos de 45 min)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '8px', boxSizing: 'border-box' }}
                  />
                  <textarea
                    rows={2}
                    value={feat.desc}
                    onChange={e => handleFeatureChange(idx, 'desc', e.target.value)}
                    placeholder="Descripción breve..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 5. PRODUCTOS & MENÚ */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Catálogo de Productos & Menú Destacado"'
              active={formData.showProductsSection}
              onToggle={() => setFormData({ ...formData, showProductsSection: !formData.showProductsSection })}
            />
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.88rem' }}>
              🛍️ Esta sección muestra automáticamente tus productos activos en la web. Puedes administrarlos en la pestaña <strong>Catálogo de Productos</strong>.
            </div>
          </div>
        )}

        {/* 6. SERVICIOS */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Servicios y Citas"'
              active={formData.showServicesSection}
              onToggle={() => setFormData({ ...formData, showServicesSection: !formData.showServicesSection })}
            />
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.88rem' }}>
              📅 Esta sección muestra automáticamente tus servicios para agendar en línea. Puedes administrarlos en la pestaña <strong>Servicios</strong>.
            </div>
          </div>
        )}

        {/* 7. TESTIMONIOS */}
        {activeTab === 'testimonials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Testimonios y Opiniones de Clientes"'
              active={formData.showTestimonialsSection}
              onToggle={() => setFormData({ ...formData, showTestimonialsSection: !formData.showTestimonialsSection })}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
                  Opiniones de Clientes
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
                  Añade prueba social de clientes satisfechos.
                </p>
              </div>
              <button
                type="button"
                onClick={addTestimonial}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                  fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Añadir Opinión
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.testimonialsJson.map((t, idx) => (
                <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Testimonio #{idx + 1} ⭐⭐⭐⭐⭐</strong>
                    {formData.testimonialsJson.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestimonial(idx)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={t.name}
                    onChange={e => handleTestimonialChange(idx, 'name', e.target.value)}
                    placeholder="Nombre del cliente (ej: Sofía Ramírez)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '8px', boxSizing: 'border-box' }}
                  />
                  <textarea
                    rows={2}
                    value={t.comment}
                    onChange={e => handleTestimonialChange(idx, 'comment', e.target.value)}
                    placeholder="Comentario u opinión positiva..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 8. CONTACTO & REDES */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <SectionToggle
              title='Sección "Contacto, Ubicación & Redes"'
              active={formData.showContactSection}
              onToggle={() => setFormData({ ...formData, showContactSection: !formData.showContactSection })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactPhone || ''}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Ej: +506 8888-8888"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Ej: contacto@minegocio.cr"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Dirección Física o Ubicación
              </label>
              <input
                type="text"
                value={formData.contactAddress || ''}
                onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                placeholder="Ej: 200m Norte del Parque Central, San José, Costa Rica"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                🔗 Enlaces a Redes Sociales
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <Instagram size={16} color="#e1306c" /> Instagram URL
                  </label>
                  <input
                    type="text"
                    value={formData.instagramUrl || ''}
                    onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/minegocio"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <Facebook size={16} color="#1877f2" /> Facebook URL
                  </label>
                  <input
                    type="text"
                    value={formData.facebookUrl || ''}
                    onChange={e => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/minegocio"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    🎵 TikTok URL
                  </label>
                  <input
                    type="text"
                    value={formData.tiktokUrl || ''}
                    onChange={e => setFormData({ ...formData, tiktokUrl: e.target.value })}
                    placeholder="https://tiktok.com/@minegocio"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 9. VISTA PREVIA EN VIVO */}
        {activeTab === 'preview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>Modo de Vista:</span>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px',
                    backgroundColor: previewDevice === 'desktop' ? '#2563eb' : '#f1f5f9',
                    color: previewDevice === 'desktop' ? 'white' : '#475569',
                    border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700'
                  }}
                >
                  <Monitor size={15} /> Computadora
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px',
                    backgroundColor: previewDevice === 'mobile' ? '#2563eb' : '#f1f5f9',
                    color: previewDevice === 'mobile' ? 'white' : '#475569',
                    border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700'
                  }}
                >
                  <Smartphone size={15} /> Teléfono Móvil
                </button>
              </div>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Abrir en nueva pestaña <ExternalLink size={14} />
              </a>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#0b0f19',
              padding: '24px 12px',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: previewDevice === 'mobile' ? '375px' : '100%',
                maxWidth: previewDevice === 'mobile' ? '375px' : '1000px',
                height: '600px',
                borderRadius: '16px',
                border: previewDevice === 'mobile' ? '8px solid #334155' : '1px solid #1e293b',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}>
                <iframe
                  src={publicUrl}
                  title="Vista Previa de la Página Web"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
