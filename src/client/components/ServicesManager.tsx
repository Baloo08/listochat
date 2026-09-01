import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle, AlertCircle, Wrench, Clock, DollarSign, Tag, X, Sliders, Layers, Copy, Bookmark, Sparkles } from 'lucide-react';
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
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [category, setCategory] = useState('General');
  const [parallelSlots, setParallelSlots] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);

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
  }, []);

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice(15000);
    setDuration('45 min');
    setEstimatedMinutes(45);
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
    setDuration(svc.duration || '45 min');
    setEstimatedMinutes(Number(svc.estimatedMinutes) || 45);
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
    setDuration(svc.duration || '45 min');
    setEstimatedMinutes(Number(svc.estimatedMinutes) || 45);
    setCategory(svc.category || 'General');
    setParallelSlots(svc.parallelSlots || 1);
    setActive(svc.active !== false);
    setCustomVariables(svc.customVariables || []);
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

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando servicios...</div>
      ) : filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <Wrench size={40} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No hay servicios registrados</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 15px 0' }}>Comienza agregando tu primer servicio para que los clientes puedan agendar citas.</p>
          <button
            onClick={handleOpenCreateModal}
            style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            + Agregar Primer Servicio
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                      ⏱️ {service.duration || `${service.estimatedMinutes || 45} min`}
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
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: service.active !== false ? '#dcfce7' : '#fee2e2',
                        color: service.active !== false ? '#15803d' : '#b91c1c'
                      }}>
                        {service.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateService(service)}
                          style={{
                            padding: '5px 10px', backgroundColor: '#ecfdf5', color: '#047857',
                            border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', fontWeight: '700'
                          }}
                          title="Duplicar este servicio para crear uno nuevo similar"
                        >
                          <Copy size={13} /> Duplicar
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          style={{ padding: '5px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                          title="Editar servicio"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          style={{ padding: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lavado Completo, Limpieza Dental, Cambio de Aceite..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Qué incluye este servicio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio Base (₡) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15000"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Odontología, Lavado, Mantenimiento"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Duración Base Estimada</label>
                  <select
                    value={estimatedMinutes}
                    onChange={(e) => {
                      const mins = Number(e.target.value);
                      setEstimatedMinutes(mins);
                      setDuration(`${mins} min`);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: 'white' }}
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (60 min)</option>
                    <option value={90}>1 hora 30 min (90 min)</option>
                    <option value={120}>2 horas (120 min)</option>
                    <option value={180}>3 horas (180 min)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Cupos Simultáneos (Sillas/Bahías)</label>
                  <input
                    type="number"
                    min="1"
                    value={parallelSlots}
                    onChange={(e) => setParallelSlots(Math.max(1, Number(e.target.value)))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* ==============================================================
                  CUSTOM VARIABLES & MODIFIERS FOR SERVICES
              ============================================================== */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={16} color="var(--primary)" /> Variables & Modificadores del Servicio
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Opciones que alteran el precio o la duración de la cita (ej: Tipo de Vehículo: Sedán, SUV, 4x4).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariableGroup}
                    style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Agregar Variable
                  </button>
                </div>

                {customVariables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Este servicio no tiene variables. Haz clic en "Agregar Variable" si el precio o duración cambia según el tipo de vehículo o atención.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {customVariables.map((group, gIdx) => (
                      <div key={group.id || gIdx} style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                        
                        {/* Group Header */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Nombre (ej: Tipo de Vehículo)"
                            value={group.name}
                            onChange={(e) => updateVariableGroup(gIdx, { name: e.target.value })}
                            style={{ flex: 1, minWidth: '160px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 'bold' }}
                          />

                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                          {group.options.map((opt, oIdx) => (
                            <div key={opt.id || oIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              
                              <input
                                type="text"
                                placeholder="Nombre de opción (ej: SUV / 4x4)"
                                value={opt.name}
                                onChange={(e) => updateOptionInGroup(gIdx, oIdx, { name: e.target.value })}
                                style={{ flex: 1, minWidth: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₡+/-</span>
                                <input
                                  type="number"
                                  placeholder="+/- Precio (0)"
                                  value={opt.priceDelta || ''}
                                  onChange={(e) => updateOptionInGroup(gIdx, oIdx, { priceDelta: Number(e.target.value) })}
                                  style={{ width: '85px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱️ +/- min</span>
                                <input
                                  type="number"
                                  placeholder="+/- min (0)"
                                  value={opt.durationMinutesDelta || ''}
                                  onChange={(e) => updateOptionInGroup(gIdx, oIdx, { durationMinutesDelta: Number(e.target.value) })}
                                  style={{ width: '75px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeOptionFromGroup(gIdx, oIdx)}
                                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addOptionToGroup(gIdx)}
                            style={{ alignSelf: 'flex-start', border: 'none', background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span>Servicio activo y disponible para clientes</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
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
