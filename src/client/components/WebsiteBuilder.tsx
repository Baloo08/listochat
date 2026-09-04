import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { loadGoogleFont, getFontFamilyCss, CURATED_FONTS } from '../utils/fontLoader';
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
  Package,
  Wrench,
  Columns,
  Sliders,
  ShieldCheck,
  Clock,
  Square,
  CircleDot,
  MousePointer,
  Image as ImageIcon
} from 'lucide-react';

// Official Brand SVG Icons (100% Vector, No Emojis)
export const WhatsAppIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const InstagramIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const FacebookIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const TikTokIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

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
  logoWhiteUrl?: string;
  backgroundColor?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  buttonHoverEffect: boolean;
  buttonTextColor: string;
  showStoreButton: boolean;
  showBookingButton: boolean;
  showCourtsButton: boolean;
  storeButtonText: string;
  bookingButtonText: string;
  courtsButtonText: string;
  showWhatsappButton: boolean;
  whatsappButtonText: string;
  headerLayout: 'split' | 'overlay' | 'banner_top';
  overlayColor: string;
  overlayOpacity: number;
  navbarStyle?: 'glass' | 'floating' | 'solid' | 'gradient' | 'minimal';
  navbarBgColor?: string;
  navbarTextColor?: string;
  navbarHoverColor?: string;
  hoverEffectType?: 'lift' | 'glow' | 'scale' | 'border_highlight';
  hoverGlowColor?: string;
  servicesPerPage?: number;
  productsPerPage?: number;
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
  const logoWhiteInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<WebsiteConfig>({
    websiteEnabled: true,
    headline: 'Bienvenido a nuestro sitio oficial',
    subheadline: 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
    aboutTitle: 'Conoce Nuestra Historia',
    aboutText: 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categoría. Nuestro compromiso es tu satisfacción total.',
    backgroundColor: '#ffffff',
    primaryColor: '#2563eb',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    buttonStyle: 'rounded',
    buttonHoverEffect: true,
    buttonTextColor: '#ffffff',
    showStoreButton: true,
    showBookingButton: true,
    showCourtsButton: false,
    storeButtonText: 'Ver Menú y Productos',
    bookingButtonText: 'Agendar Cita en Línea',
    courtsButtonText: 'Reservar Cancha',
    showWhatsappButton: true,
    whatsappButtonText: 'WhatsApp Directo',
    headerLayout: 'split',
    overlayColor: '#0f172a',
    overlayOpacity: 0,
    navbarStyle: 'glass',
    navbarBgColor: '#ffffff',
    navbarTextColor: '#0f172a',
    navbarHoverColor: '#2563eb',
    hoverEffectType: 'lift',
    hoverGlowColor: '#38bdf8',
    servicesPerPage: 6,
    productsPerPage: 8,
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

  useEffect(() => {
    loadGoogleFont(formData.fontFamily);
  }, [formData.fontFamily]);

  const loadWebsiteSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/website');
      if (res) {
        setFormData(prev => ({
          ...prev,
          ...res,
          logoWhiteUrl: res.logoWhiteUrl || '',
          buttonStyle: res.buttonStyle || 'rounded',
          buttonHoverEffect: res.buttonHoverEffect !== false,
          buttonTextColor: res.buttonTextColor || '#ffffff',
          showWhatsappButton: res.showWhatsappButton !== false,
          whatsappButtonText: res.whatsappButtonText || 'WhatsApp Directo',
          headerLayout: res.headerLayout || 'split',
          overlayColor: res.overlayColor || '#0f172a',
          overlayOpacity: res.overlayOpacity !== undefined ? Number(res.overlayOpacity) : 0,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'logoWhiteUrl' | 'bannerImageUrl' | 'aboutImageUrl') => {
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
        const nextData = { ...formData, [fieldName]: data.url };
        setFormData(nextData);
        // Auto-save to database immediately so the uploaded image is never lost
        try {
          await api.post('/api/website', nextData);
        } catch (saveErr) {
          console.warn('Auto-save background notice:', saveErr);
        }
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
          {active ? 'Esta sección está activa y visible en tu web' : 'Esta sección está desactivada y oculta en tu web'}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: active ? '#16a34a' : '#cbd5e1',
          color: 'white',
          fontWeight: '700',
          fontSize: '0.8rem',
          cursor: 'pointer'
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
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
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
            Configura el estilo de portada, activa/desactiva secciones y comparte tu enlace web oficial.
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
          { id: 'preview', label: 'Vista Previa', icon: <Eye size={16} /> }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '820px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
              Diseño y Portada Principal
            </h3>

            {/* ESTILO DE PORTADA / LAYOUT */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Estilo de Visualización de la Portada
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                
                {/* Opción 1: Split / Imagen separada */}
                <div
                  onClick={() => setFormData({ ...formData, headerLayout: 'split' })}
                  style={{
                    padding: '14px', borderRadius: '10px', cursor: 'pointer',
                    border: formData.headerLayout === 'split' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: formData.headerLayout === 'split' ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Columns size={18} color={formData.headerLayout === 'split' ? '#2563eb' : '#64748b'} />
                    <strong style={{ fontSize: '0.88rem', color: formData.headerLayout === 'split' ? '#1e40af' : '#334155' }}>
                      Imagen a un lado (Recomendado)
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    El texto va a la izquierda y la imagen se aprecia completa a la derecha sin capas de color encima.
                  </p>
                </div>

                {/* Opción 2: Overlay / Texto sobre imagen */}
                <div
                  onClick={() => setFormData({ ...formData, headerLayout: 'overlay' })}
                  style={{
                    padding: '14px', borderRadius: '10px', cursor: 'pointer',
                    border: formData.headerLayout === 'overlay' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: formData.headerLayout === 'overlay' ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sliders size={18} color={formData.headerLayout === 'overlay' ? '#2563eb' : '#64748b'} />
                    <strong style={{ fontSize: '0.88rem', color: formData.headerLayout === 'overlay' ? '#1e40af' : '#334155' }}>
                      Texto sobre Imagen (Cover)
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    La imagen abarca todo el fondo con control de color y opacidad del filtro.
                  </p>
                </div>

                {/* Opción 3: Banner Top / Panorámico Superior */}
                <div
                  onClick={() => setFormData({ ...formData, headerLayout: 'banner_top' })}
                  style={{
                    padding: '14px', borderRadius: '10px', cursor: 'pointer',
                    border: formData.headerLayout === 'banner_top' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: formData.headerLayout === 'banner_top' ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ImageIcon size={18} color={formData.headerLayout === 'banner_top' ? '#2563eb' : '#64748b'} />
                    <strong style={{ fontSize: '0.88rem', color: formData.headerLayout === 'banner_top' ? '#1e40af' : '#334155' }}>
                      Banner Superior Panorámico
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    La foto del banner va arriba a todo lo ancho, con el título y botones centrados abajo.
                  </p>
                </div>

              </div>

              {/* CONTROLES DE OVERLAY SI ESTÁ EN MODO OVERLAY */}
              {formData.headerLayout === 'overlay' && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Color del Filtro / Capa
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={formData.overlayColor || '#0f172a'}
                        onChange={e => setFormData({ ...formData, overlayColor: e.target.value })}
                        style={{ width: '38px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={formData.overlayColor || '#0f172a'}
                        onChange={e => setFormData({ ...formData, overlayColor: e.target.value })}
                        style={{ width: '110px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Opacidad del Filtro: <strong>{formData.overlayOpacity ?? 0}%</strong> {formData.overlayOpacity === 0 ? '(Sin plasta de color)' : ''}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={formData.overlayOpacity ?? 0}
                      onChange={e => setFormData({ ...formData, overlayOpacity: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>0% (Limpio)</span>
                      <span>50%</span>
                      <span>90% (Oscuro)</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* IMAGEN DE PORTADA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Imagen de Portada / Banner
              </label>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {formData.bannerImageUrl && (
                  <img
                    src={formData.bannerImageUrl}
                    alt="Banner"
                    style={{ width: '130px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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

            {/* TEXTOS PRINCIPALES */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Título Principal
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Ej: El sabor auténtico de nuestro negocio"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
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
                placeholder="Ej: Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* BOTONES PRINCIPALES DE ACCIÓN */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                Botones Principales de Llamado a la Acción (CTA)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                
                {/* Botón Tienda */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                      <ShoppingBag size={16} color="#2563eb" /> Botón Tienda / Menú
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer' }}>
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
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Botón Reservas */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                      <Calendar size={16} color="#a855f7" /> Botón Citas / Agenda
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer' }}>
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
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Botón Canchas */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      Botón Canchas / Deportes
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.showCourtsButton}
                        onChange={e => setFormData({ ...formData, showCourtsButton: e.target.checked })}
                      /> Activo
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!formData.showCourtsButton}
                    value={formData.courtsButtonText}
                    onChange={e => setFormData({ ...formData, courtsButtonText: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Botón WhatsApp */}
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                      <WhatsAppIcon size={16} color="#16a34a" /> Botón WhatsApp
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.showWhatsappButton}
                        onChange={e => setFormData({ ...formData, showWhatsappButton: e.target.checked })}
                      /> Activo
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!formData.showWhatsappButton}
                    value={formData.whatsappButtonText}
                    onChange={e => setFormData({ ...formData, whatsappButtonText: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>

              </div>
            </div>

            {/* Botón Guardar Cambios de Portada */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '11px 24px', borderRadius: '10px',
                  backgroundColor: '#2563eb', color: 'white', border: 'none',
                  fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Guardar Cambios de Portada'}
              </button>
            </div>

          </div>
        )}

        {/* 2. MARCA & COLORES */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
              Identidad Visual, Logotipos y Estilos
            </h3>

            {/* SECCIÓN LOGOTIPOS (FONDO CLARO Y FONDO OSCURO) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              {/* Logo Principal (Fondo Claro) */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Logotipo Principal (Navbar & Fondos Claros)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Principal"
                      style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '4px', backgroundColor: '#ffffff' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>
                      Logo Claro
                    </div>
                  )}
                  <div>
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
                        padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'
                      }}
                    >
                      <Upload size={14} /> Subir Logo Principal
                    </button>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PNG transparente recomendado</span>
                  </div>
                </div>
              </div>

              {/* Logo para Fondos Oscuros (Blanco / Transparente) */}
              <div style={{ backgroundColor: '#0b1120', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>
                    Logo para Fondos Oscuros (Footer / Blanco)
                  </label>
                  {formData.logoWhiteUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoWhiteUrl: '' })}
                      style={{ border: 'none', background: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {formData.logoWhiteUrl ? (
                    <img
                      src={formData.logoWhiteUrl}
                      alt="Logo Blanco"
                      style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', padding: '4px', backgroundColor: '#1e293b' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', textAlign: 'center', padding: '4px' }}>
                      Opcional Blanco
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={logoWhiteInputRef}
                      onChange={e => handleImageUpload(e, 'logoWhiteUrl')}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => logoWhiteInputRef.current?.click()}
                      style={{
                        padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: '#1e293b', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px'
                      }}
                    >
                      <Upload size={14} /> Subir Logo Blanco
                    </button>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Usado en el footer oscuro</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECCIÓN ESTILO Y EFECTO DE BOTONES */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MousePointer size={18} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  Estilo y Comportamiento de los Botones
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                
                {/* Forma del Botón */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Forma de las Esquinas
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'rounded', label: 'Redondeado (10px)' },
                      { id: 'pill', label: 'Cápsula (Pill)' },
                      { id: 'square', label: 'Cuadrado (6px)' }
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, buttonStyle: b.id as any })}
                        style={{
                          flex: 1, padding: '8px 6px',
                          borderRadius: b.id === 'pill' ? '9999px' : b.id === 'square' ? '4px' : '8px',
                          border: formData.buttonStyle === b.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: formData.buttonStyle === b.id ? '#eff6ff' : '#ffffff',
                          color: formData.buttonStyle === b.id ? '#1e40af' : '#475569',
                          fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center'
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Efecto Hover Animado */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Micro-animación al pasar el mouse (Hover)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, buttonHoverEffect: true })}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: '8px',
                        border: formData.buttonHoverEffect !== false ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        backgroundColor: formData.buttonHoverEffect !== false ? '#f0fdf4' : '#ffffff',
                        color: formData.buttonHoverEffect !== false ? '#166534' : '#475569',
                        fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                      }}
                    >
                      🟢 Con Efecto Hover
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, buttonHoverEffect: false })}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: '8px',
                        border: formData.buttonHoverEffect === false ? '2px solid #64748b' : '1px solid #cbd5e1',
                        backgroundColor: formData.buttonHoverEffect === false ? '#f1f5f9' : '#ffffff',
                        color: formData.buttonHoverEffect === false ? '#0f172a' : '#475569',
                        fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                      }}
                    >
                      ⚪ Estático (Plano)
                    </button>
                  </div>
                </div>

              </div>
            </div>


            {/* SECCIÓN BARRA DE NAVEGACIÓN (NAVBAR EFFECTS & COLORS) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Layout size={18} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  Efectos y Estilo de la Barra de Navegación (Navbar)
                </h4>
              </div>

              {/* Selector de Estilo de Navbar */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Estilo Visual del Navbar
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'glass', label: '🫧 Cristal (Blur)' },
                    { id: 'floating', label: '🛸 Flotante 3D' },
                    { id: 'solid', label: '🎨 Color Sólido' },
                    { id: 'gradient', label: '🌈 Degradado' },
                    { id: 'minimal', label: '💎 Minimalista' }
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, navbarStyle: style.id as any })}
                      style={{
                        padding: '10px 8px', borderRadius: '8px',
                        border: (formData.navbarStyle || 'glass') === style.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: (formData.navbarStyle || 'glass') === style.id ? '#eff6ff' : '#ffffff',
                        color: (formData.navbarStyle || 'glass') === style.id ? '#1e40af' : '#475569',
                        fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center'
                      }}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colores del Navbar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Fondo del Navbar
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.navbarBgColor || '#ffffff'}
                      onChange={e => setFormData({ ...formData, navbarBgColor: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.navbarBgColor || '#ffffff'}
                      onChange={e => setFormData({ ...formData, navbarBgColor: e.target.value })}
                      style={{ width: '100px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Texto y Enlaces
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.navbarTextColor || '#0f172a'}
                      onChange={e => setFormData({ ...formData, navbarTextColor: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.navbarTextColor || '#0f172a'}
                      onChange={e => setFormData({ ...formData, navbarTextColor: e.target.value })}
                      style={{ width: '100px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Efecto Hover en Enlaces
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.navbarHoverColor || formData.primaryColor || '#2563eb'}
                      onChange={e => setFormData({ ...formData, navbarHoverColor: e.target.value })}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.navbarHoverColor || formData.primaryColor || '#2563eb'}
                      onChange={e => setFormData({ ...formData, navbarHoverColor: e.target.value })}
                      style={{ width: '100px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN EFECTOS HOVER Y RESPLANDOR (HOVER EFFECTS) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sparkles size={18} color="#a855f7" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  Efectos Hover Interactivos en Tarjetas y Botones
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Tipo de animación hover */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Animación al pasar el mouse
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'lift', label: '🚀 Elevación 3D' },
                      { id: 'glow', label: '✨ Resplandor Neón' },
                      { id: 'scale', label: '🔍 Zoom Suave' },
                      { id: 'border_highlight', label: '🌟 Borde Iluminado' }
                    ].map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, hoverEffectType: h.id as any })}
                        style={{
                          padding: '9px 8px', borderRadius: '8px',
                          border: (formData.hoverEffectType || 'lift') === h.id ? '2px solid #a855f7' : '1px solid #cbd5e1',
                          backgroundColor: (formData.hoverEffectType || 'lift') === h.id ? '#faf5ff' : '#ffffff',
                          color: (formData.hoverEffectType || 'lift') === h.id ? '#7e22ce' : '#475569',
                          fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center'
                        }}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color del Resplandor / Hover */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Color del Efecto Hover / Resplandor
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.hoverGlowColor || '#38bdf8'}
                      onChange={e => setFormData({ ...formData, hoverGlowColor: e.target.value })}
                      style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.hoverGlowColor || '#38bdf8'}
                      onChange={e => setFormData({ ...formData, hoverGlowColor: e.target.value })}
                      style={{ width: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                    Define la luz o sombra que desprenden las tarjetas y botones al interactuar con ellos.
                  </p>
                </div>
              </div>
            </div>


            {/* SECCIÓN COLOR DE FONDO GENERAL DEL SITIO WEB */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                Color de Fondo General del Sitio Web
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[
                  { name: 'Blanco Puro', hex: '#ffffff' },
                  { name: 'Gris Suave', hex: '#f8fafc' },
                  { name: 'Pizarra Oscura', hex: '#0f172a' },
                  { name: 'Azul Noche', hex: '#0b1329' },
                  { name: 'Grafito', hex: '#18181b' },
                  { name: 'Crema Cálido', hex: '#fafaf9' }
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        backgroundColor: c.hex,
                        navbarBgColor: c.hex === '#0f172a' || c.hex === '#0b1329' || c.hex === '#18181b' ? c.hex : formData.navbarBgColor,
                        navbarTextColor: c.hex === '#0f172a' || c.hex === '#0b1329' || c.hex === '#18181b' ? '#ffffff' : formData.navbarTextColor
                      });
                    }}
                    style={{
                      padding: '7px 12px', borderRadius: '8px',
                      border: (formData.backgroundColor || '#ffffff') === c.hex ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: c.hex,
                      color: (c.hex === '#0f172a' || c.hex === '#0b1329' || c.hex === '#18181b') ? '#ffffff' : '#0f172a',
                      cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #94a3b8', backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={formData.backgroundColor || '#ffffff'}
                  onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                  style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={formData.backgroundColor || '#ffffff'}
                  onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                  style={{ width: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Alerta Asesora de Contraste (Informativa, Respeta la Personalización) */}
              {(() => {
                const getLum = (hex: string) => {
                  const c = (hex || '#ffffff').replace('#', '');
                  const r = parseInt(c.substring(0, 2), 16) || 0;
                  const g = parseInt(c.substring(2, 4), 16) || 0;
                  const b = parseInt(c.substring(4, 6), 16) || 0;
                  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                };
                const bgL = getLum(formData.backgroundColor || '#ffffff');
                const textL = getLum(formData.navbarTextColor || '#0f172a');
                const isLowContrast = Math.abs(bgL - textL) < 0.35;

                if (isLowContrast) {
                  return (
                    <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: '1.4' }}>
                        <strong>⚠️ Sugerencia de Contraste:</strong> La combinación de fondo y color de texto actual podría tener baja visibilidad. Puedes pulsar el botón para optimizarla o conservar tus colores elegidos.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isBgDark = bgL < 0.5;
                          setFormData({
                            ...formData,
                            navbarTextColor: isBgDark ? '#ffffff' : '#0f172a',
                            buttonTextColor: '#ffffff'
                          });
                        }}
                        style={{
                          padding: '6px 12px', backgroundColor: '#d97706', color: 'white',
                          border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                        }}
                      >
                        🪄 Ajustar Contraste Óptimo
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
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
                style={{ width: '100%', maxWidth: '350px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: 'white', fontFamily: getFontFamilyCss(formData.fontFamily) }}
              >
                {CURATED_FONTS.map(f => (
                  <option key={f.name} value={f.name} style={{ fontFamily: `'${f.name}', sans-serif`, padding: '6px' }}>
                    {f.name} — {f.description} ({f.category === 'serif' ? 'Serif' : 'Sans-Serif'})
                  </option>
                ))}
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
              Esta sección muestra automáticamente tus productos activos en la web. Puedes administrarlos en la pestaña <strong>Catálogo de Productos</strong>.
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
              Esta sección muestra automáticamente tus servicios para agendar en línea. Puedes administrarlos en la pestaña <strong>Servicios</strong>.
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
                    <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Testimonio #{idx + 1}</strong>
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
                Enlaces a Redes Sociales Oficiales
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <InstagramIcon size={16} color="#e1306c" /> Instagram URL
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
                    <FacebookIcon size={16} color="#1877f2" /> Facebook URL
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
                    <TikTokIcon size={16} color="#000000" /> TikTok URL
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

        {/* 9. VISTA PREVIA */}
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
