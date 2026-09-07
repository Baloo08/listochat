import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, CheckCircle, AlertCircle, Wrench, Clock, 
  DollarSign, Tag, X, Sliders, Layers, Copy, Bookmark, Sparkles, LayoutGrid, List, Users 
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Service, CustomVariable, CustomVariableOption } from '../../shared/types';

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(15000);
  const [duration, setDuration] = useState('45 min');
  const [durationType, setDurationType] = useState<'preset' | 'custom' | 'full_day'>('preset');
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMins, setCustomMins] = useState<number>(0);

  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [category, setCategory] = useState('General');
  const [parallelSlots, setParallelSlots] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);

  const formatDurationDisplay = (mins: number) => {
    if (mins >= 1440 || mins === 480) return '☀️ Día Completo';
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
    }
    return `${mins} min`;
  };

  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => (typeof window !== 'undefined' && window.innerWidth < 768) ? 'cards' : 'table');

  const api = useApi();

  const fetchServices = async () => {
    try {
      const data = await api.get('/api/services');
      if (data) setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleActive = async (service: Service) => {
    try {
      const newActive = service.active === false ? true : false;
      await api.put(`/api/services/${service.id}`, { active: newActive });
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, active: newActive } : s));
    } catch (err) {
      console.error('Error toggling service active state:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice(15000);
    setDuration('45 min');
    setEstimatedMinutes(45);
    setDurationType('preset');
    setCustomHours(1);
    setCustomMins(0);
    setCategory('General');
    setParallelSlots(1);
    setActive(true);
    setCustomVariables([]);
    setIsModalOpen(true);
  };

  const handleDuplicateService = (svc: Service) => {
    setEditingService(null);
    setName((svc.name || '') + ' (Copia)');
    setDescription(svc.description || '');
    setPrice(Number(svc.price) || 0);
    
    const mins = Number(svc.estimatedMinutes) || 45;
    setEstimatedMinutes(mins);

    const isExplicitFullDay = svc.duration === 'Día Completo' || mins >= 1440;
    if (isExplicitFullDay) {
      setDurationType('full_day');
      setDuration('Día Completo');
      setCustomHours(24);
      setCustomMins(0);
    } else if ([15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480].includes(mins)) {
      setDurationType('preset');
      setDuration(formatDurationDisplay(mins));
      setCustomHours(Math.floor(mins / 60));
      setCustomMins(mins % 60);
    } else {
      setDurationType('custom');
      setCustomHours(Math.floor(mins / 60));
      setCustomMins(mins % 60);
      setDuration(formatDurationDisplay(mins));
    }

    setCategory(svc.category || 'General');
    setParallelSlots(svc.parallelSlots || 1);
    setActive(true);
    setCustomVariables(svc.customVariables ? JSON.parse(JSON.stringify(svc.customVariables)) : []);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (svc: Service) => {
    setEditingService(svc);
    setName(svc.name || '');
    setDescription(svc.description || '');
    setPrice(Number(svc.price) || 0);
    
    const mins = Number(svc.estimatedMinutes) || 45;
    setEstimatedMinutes(mins);

    const isExplicitFullDay = svc.duration === 'Día Completo' || mins >= 1440;
    if (isExplicitFullDay) {
      setDurationType('full_day');
      setDuration('Día Completo');
      setCustomHours(24);
      setCustomMins(0);
    } else if ([15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480].includes(mins)) {
      setDurationType('preset');
      setDuration(formatDurationDisplay(mins));
      setCustomHours(Math.floor(mins / 60));
      setCustomMins(mins % 60);
    } else {
      setDurationType('custom');
      setCustomHours(Math.floor(mins / 60));
      setCustomMins(mins % 60);
      setDuration(formatDurationDisplay(mins));
    }

    setCategory(svc.category || 'General');
    setParallelSlots(svc.parallelSlots || 1);
    setActive(svc.active !== false);
    setCustomVariables(svc.customVariables ? JSON.parse(JSON.stringify(svc.customVariables)) : []);
    setIsModalOpen(true);
  };


  // Pre-configured and Custom Saved Presets
  const SERVICE_PRESETS: Record<string, CustomVariable> = {
    vehiculo: {
      id: 'var_vehiculo',
      name: 'Tipo de Vehículo',
      type: 'select',
      required: true,
      options: [
        { id: 'opt_sedan', name: 'Sedán / Compacto', priceDelta: 0, durationMinutesDelta: 0 },
        { id: 'opt_suv', name: 'SUV / Crossover (+₡3.000)', priceDelta: 3000, durationMinutesDelta: 15 },
        { id: 'opt_4x4', name: '4x4 / Pick-Up (+₡5.000)', priceDelta: 5000, durationMinutesDelta: 25 },
        { id: 'opt_moto', name: 'Motocicleta (-₡2.000)', priceDelta: -2000, durationMinutesDelta: -15 }
      ]
    },
    cabello: {
      id: 'var_cabello',
      name: 'Largo de Cabello',
      type: 'select',
      required: true,
      options: [
        { id: 'opt_corto', name: 'Cabello Corto', priceDelta: 0, durationMinutesDelta: 0 },
        { id: 'opt_medio', name: 'Cabello Medio (+₡2.500)', priceDelta: 2500, durationMinutesDelta: 15 },
        { id: 'opt_largo', name: 'Cabello Largo (+₡5.000)', priceDelta: 5000, durationMinutesDelta: 30 },
        { id: 'opt_xl', name: 'Extra Largo (+₡8.000)', priceDelta: 8000, durationMinutesDelta: 45 }
      ]
    },
    tratamiento: {
      id: 'var_tratamiento',
      name: 'Nivel de Servicio / Tratamiento',
      type: 'select',
      required: false,
      options: [
        { id: 'opt_basico', name: 'Básico / Estándar', priceDelta: 0, durationMinutesDelta: 0 },
        { id: 'opt_premium', name: 'Tratamiento Premium (+₡5.000)', priceDelta: 5000, durationMinutesDelta: 20 },
        { id: 'opt_vip', name: 'Experiencia VIP / Completa (+₡10.000)', priceDelta: 10000, durationMinutesDelta: 35 }
      ]
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    let preset: CustomVariable | null = null;
    if (SERVICE_PRESETS[presetKey]) {
      preset = JSON.parse(JSON.stringify(SERVICE_PRESETS[presetKey]));
    } else {
      const saved = localStorage.getItem('betico_saved_service_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[presetKey]) preset = JSON.parse(JSON.stringify(parsed[presetKey]));
      }
    }

    if (preset) {
      preset.id = 'var_' + Date.now();
      preset.options = preset.options.map((o: any, idx: number) => ({ ...o, id: 'opt_' + Date.now() + '_' + idx }));
      setCustomVariables(prev => [...prev, preset!]);
    }
  };

  const handleSaveAsPreset = (group: CustomVariable) => {
    const presetName = prompt('Nombre para guardar esta plantilla de variante:', group.name);
    if (!presetName) return;
    const saved = localStorage.getItem('betico_saved_service_presets') || '{}';
    const parsed = JSON.parse(saved);
    const key = 'custom_' + Date.now();
    parsed[key] = { ...group, name: presetName };
    localStorage.setItem('betico_saved_service_presets', JSON.stringify(parsed));
    alert('¡Plantilla "' + presetName + '" guardada en tus variantes personalizadas!');
  };


  // Variable Helpers
  const addVariableGroup = () => {
    const newGroup: CustomVariable = {
      id: 'var_' + Date.now(),
      name: 'Tipo de Vehículo / Modalidad',
      type: 'select',
      required: false,
      options: [
        { id: 'opt_1', name: 'Estándar / Sedán', priceDelta: 0, durationMinutesDelta: 0 }
      ]
    };
    setCustomVariables(prev => [...prev, newGroup]);
  };

  const updateVariableGroup = (index: number, updates: Partial<CustomVariable>) => {
    setCustomVariables(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeVariableGroup = (index: number) => {
    setCustomVariables(prev => prev.filter((_, i) => i !== index));
  };

  const addOptionToGroup = (groupIndex: number) => {
    setCustomVariables(prev => {
      const copy = [...prev];
      const newOption: CustomVariableOption = {
        id: 'opt_' + Date.now(),
        name: 'Opción Adicional',
        priceDelta: 0,
        durationMinutesDelta: 0
      };
      copy[groupIndex].options = [...copy[groupIndex].options, newOption];
      return copy;
    });
  };

  const updateOptionInGroup = (groupIndex: number, optionIndex: number, updates: Partial<CustomVariableOption>) => {
    setCustomVariables(prev => {
      const copy = [...prev];
      copy[groupIndex].options[optionIndex] = { ...copy[groupIndex].options[optionIndex], ...updates };
      return copy;
    });
  };

  const removeOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setCustomVariables(prev => {
      const copy = [...prev];
      copy[groupIndex].options = copy[groupIndex].options.filter((_, i) => i !== optionIndex);
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price < 0) {
      alert('Por favor ingresa el nombre y precio del servicio');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        price: Number(price),
        duration,
        estimatedMinutes: Number(estimatedMinutes),
        category: category || 'General',
        parallelSlots: Math.max(1, Number(parallelSlots) || 1),
        customVariables,
        active
      };

      if (editingService) {
        await api.put(`/api/services/${editingService.id}`, payload);
      } else {
        await api.post('/api/services', payload);
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err: any) {
      alert('Error al guardar servicio: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio del catálogo?')) return;
    try {
      await api.del(`/api/services/${id}`);
      await fetchServices();
    } catch (error) {
      alert('Error al eliminar servicio');
    }
  };

  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'General')))];

  const filteredServices = services.filter(s => {
    const matchesCategory = activeCategory === 'Todos' || (s.category || 'General') === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Catálogo de Servicios</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Servicios ofrecidos para agendamiento por WhatsApp y portal público de reservas
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Nuevo Servicio
        </button>
      </div>

      {/* Filter, Search Bar and View Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, minWidth: '180px', paddingBottom: '2px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                color: activeCategory === cat ? 'white' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Toggle: Cards vs Table */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', padding: '2px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'cards' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: '700'
            }}
            title="Vista de Tarjetas (Fácil navegación en móviles)"
          >
            <LayoutGrid size={14} /> Tarjetas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: '700'
            }}
            title="Vista de Tabla"
          >
            <List size={14} /> Tabla
          </button>
        </div>
      </div>

      {/* Services Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando catálogo de servicios...</div>
      ) : filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Wrench size={40} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text)' }}>No hay servicios registrados</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 15px 0' }}>Comienza agregando tu primer servicio para que los clientes puedan agendar citas.</p>
          <button
            onClick={handleOpenCreateModal}
            style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            + Agregar Primer Servicio
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ==============================================================
           MOBILE-FIRST CARD LIST VIEW
        ============================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredServices.map(service => {
            const varCount = (service.customVariables || []).length;
            const isActive = service.active !== false;

            return (
              <div
                key={service.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Top Row: Name, Category and Status Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {service.category || 'General'}
                      </span>
                      {varCount > 0 && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontSize: '0.72rem',
                          fontWeight: '600'
                        }}>
                          {varCount} variable{varCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1.3' }}>
                      {service.name}
                    </h3>
                    {service.description && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Active / Inactive Status Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    style={{
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                      color: isActive ? '#15803d' : '#b91c1c',
                      flexShrink: 0
                    }}
                    title="Toca para cambiar estado activo/inactivo"
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: isActive ? '#16a34a' : '#dc2626' }} />
                    {isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                {/* Key Metrics Chips Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>Precio Base</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)' }}>
                      ₡{Number(service.price || 0).toLocaleString('es-CR')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>Duración</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      {formatDurationDisplay(service.estimatedMinutes || 45)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>Cupos Simultáneos</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} color="var(--text-muted)" />
                      {service.parallelSlots || 1} {Number(service.parallelSlots || 1) === 1 ? 'cliente' : 'clientes'}
                    </div>
                  </div>
                </div>

                {/* Touch-Friendly Action Bar (Large Tappable Targets) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicateService(service)}
                    style={{
                      minHeight: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    title="Duplicar servicio"
                  >
                    <Copy size={15} /> Duplicar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(service)}
                    style={{
                      minHeight: '42px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    title="Editar servicio"
                  >
                    <Edit2 size={15} /> Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    style={{
                      minWidth: '42px',
                      minHeight: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Eliminar servicio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ==============================================================
           DESKTOP SCROLLABLE TABLE VIEW (WITH HORIZONTAL SCROLL FIX)
        ============================================================== */
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)', 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch' 
        }}>
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Servicio</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Categoría</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Duración Base</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Precio Base (₡)</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Variables</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => {
                const varCount = (service.customVariables || []).length;
                const isActive = service.active !== false;

                return (
                  <tr key={service.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{service.name}</div>
                      {service.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{service.description}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>
                        {service.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDurationDisplay(service.estimatedMinutes || 45)}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ₡{Number(service.price || 0).toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {varCount > 0 ? (
                        <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: '600' }}>
                          {varCount} variable{varCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin variables</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(service)}
                        style={{ 
                          border: 'none',
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#15803d' : '#b91c1c',
                          cursor: 'pointer'
                        }}
                        title="Toca para cambiar estado"
                      >
                        {isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateService(service)}
                          style={{
                            padding: '6px 10px', backgroundColor: '#ecfdf5', color: '#047857',
                            border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', fontWeight: '700'
                          }}
                          title="Duplicar servicio"
                        >
                          <Copy size={13} /> Duplicar
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          style={{ padding: '6px 10px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                          title="Editar servicio"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                          title="Eliminar servicio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Service Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: isMobile ? '0' : '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: isMobile ? '20px 20px 0 0' : '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: isMobile ? '94dvh' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            
            {/* Sticky Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--surface)',
              flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {editingService ? 'Actualiza los datos, precio o modificadores' : 'Registra un nuevo servicio en tu catálogo'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '22px', display: 'flex', flexDirection: 'column', gap: '14px', WebkitOverflowScrolling: 'touch' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lavado Completo, Limpieza Dental, Corte y Barba..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', minHeight: '42px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre lo que incluye este servicio..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                      Precio Base (₡) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="15000"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      style={{ width: '100%', minHeight: '42px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                      Categoría
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Odontología, Lavado, Estética"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', minHeight: '42px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                      Duración Base Estimada *
                    </label>
                    <select
                      value={durationType === 'custom' ? 'custom' : durationType === 'full_day' ? 'full_day' : estimatedMinutes}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setDurationType('custom');
                          const total = (customHours * 60) + customMins;
                          setEstimatedMinutes(total || 60);
                          setDuration(formatDurationDisplay(total || 60));
                        } else if (val === 'full_day') {
                          setDurationType('full_day');
                          setEstimatedMinutes(1440);
                          setDuration('Día Completo');
                        } else {
                          setDurationType('preset');
                          const mins = Number(val);
                          setEstimatedMinutes(mins);
                          setDuration(formatDurationDisplay(mins));
                        }
                      }}
                      style={{ width: '100%', minHeight: '42px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', backgroundColor: 'var(--surface)', fontWeight: '600', boxSizing: 'border-box' }}
                    >
                      <optgroup label="Minutos y Horas">
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora (60 min)</option>
                        <option value={90}>1 hora 30 min (90 min)</option>
                        <option value={120}>2 horas (120 min)</option>
                        <option value={180}>3 horas (180 min)</option>
                        <option value={240}>4 horas (240 min)</option>
                        <option value={300}>5 horas (300 min)</option>
                        <option value={360}>6 horas (360 min)</option>
                        <option value={480}>8 horas (Jornada Laboral)</option>
                      </optgroup>
                      <optgroup label="Jornadas Especiales">
                        <option value="full_day">☀️ Día Completo (Bloqueo Total)</option>
                        <option value="custom">⚡ Personalizado (Horas y Minutos libres)</option>
                      </optgroup>
                    </select>

                    {/* Campos para Horas y Minutos Personalizados */}
                    {durationType === 'custom' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#166534', display: 'block' }}>Horas:</label>
                          <input
                            type="number"
                            min="0"
                            max="72"
                            value={customHours}
                            onChange={(e) => {
                              const h = Math.max(0, Number(e.target.value));
                              setCustomHours(h);
                              const total = (h * 60) + customMins;
                              setEstimatedMinutes(total);
                              setDuration(formatDurationDisplay(total));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#166534', display: 'block' }}>Minutos:</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="5"
                            value={customMins}
                            onChange={(e) => {
                              const m = Math.max(0, Number(e.target.value));
                              setCustomMins(m);
                              const total = (customHours * 60) + m;
                              setEstimatedMinutes(total);
                              setDuration(formatDurationDisplay(total));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {durationType === 'full_day' && (
                      <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>
                        ☀️ Este servicio ocupará la jornada completa del día seleccionado.
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                      Cupos Simultáneos (Sillas/Bahías)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={parallelSlots}
                      onChange={(e) => setParallelSlots(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', minHeight: '42px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* ==============================================================
                    CUSTOM VARIABLES & MODIFIERS FOR SERVICES
                ============================================================== */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                        <Sliders size={16} color="var(--primary)" /> Variables & Modificadores
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        Opciones que modifican precio o duración (ej. Tipo de Vehículo: Sedán, SUV, 4x4).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariableGroup}
                      style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Agregar Variable
                    </button>
                  </div>

                  {customVariables.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '14px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      Este servicio no tiene variables. Haz clic en "Agregar Variable" si el precio o duración cambia según opciones seleccionadas por el cliente.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {customVariables.map((group, gIdx) => (
                        <div key={group.id || gIdx} style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                          
                          {/* Group Header */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="Nombre (ej: Tipo de Vehículo)"
                              value={group.name}
                              onChange={(e) => updateVariableGroup(gIdx, { name: e.target.value })}
                              style={{ flex: 1, minWidth: '150px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 'bold' }}
                            />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer', color: '#475569' }}>
                              <input
                                type="checkbox"
                                checked={group.required}
                                onChange={(e) => updateVariableGroup(gIdx, { required: e.target.checked })}
                              />
                              <span>Obligatorio</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeVariableGroup(gIdx)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Eliminar grupo de variable"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Options List with Price & Duration modifiers */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {group.options.map((opt, oIdx) => (
                              <div key={opt.id || oIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                                
                                <input
                                  type="text"
                                  placeholder="Opción (ej: SUV / 4x4)"
                                  value={opt.name}
                                  onChange={(e) => updateOptionInGroup(gIdx, oIdx, { name: e.target.value })}
                                  style={{ flex: 1, minWidth: '120px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>₡+/-</span>
                                  <input
                                    type="number"
                                    placeholder="Precio"
                                    value={opt.priceDelta || ''}
                                    onChange={(e) => updateOptionInGroup(gIdx, oIdx, { priceDelta: Number(e.target.value) })}
                                    style={{ width: '75px', padding: '6px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                  />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>⏱️+/-</span>
                                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={opt.durationMinutesDelta || ''}
                                    onChange={(e) => updateOptionInGroup(gIdx, oIdx, { durationMinutesDelta: Number(e.target.value) })}
                                    style={{ width: '65px', padding: '6px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeOptionFromGroup(gIdx, oIdx)}
                                  style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addOptionToGroup(gIdx)}
                              style={{ alignSelf: 'flex-start', border: 'none', background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                            >
                              <Plus size={13} /> Agregar Opción a {group.name || 'Variable'}
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Servicio activo y disponible para clientes</span>
                  </label>
                </div>

              </div>

              {/* Sticky Modal Action Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    minHeight: '44px',
                    padding: '10px 18px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: '#475569'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    minHeight: '44px',
                    padding: '10px 22px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {saving ? 'Guardando...' : editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
