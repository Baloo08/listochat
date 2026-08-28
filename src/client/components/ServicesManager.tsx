import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle, AlertCircle, Wrench, Clock, DollarSign, Tag, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Service } from '../../shared/types';

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
    setIsModalOpen(true);
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
    <div style={{ maxWidth: '950px' }}>
      
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
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Duración</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Precio (₡)</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => (
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
                    <span style={{ 
                      padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                      backgroundColor: service.active !== false ? '#dcfce7' : '#fee2e2',
                      color: service.active !== false ? '#15803d' : '#b91c1c'
                    }}>
                      {service.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEditModal(service)}
                        style={{ padding: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                        title="Editar servicio"
                      >
                        <Edit2 size={16} />
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          CREATE / EDIT SERVICE MODAL
      ========================================== */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '500px', width: '100%', padding: '26px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Limpieza Dental con Ultrasonido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Descripción del Servicio</label>
                <textarea
                  rows={2}
                  placeholder="Explica qué incluye este servicio para tus clientes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio (₡ CRC) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Odontología / Estética"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Duración visible (texto)</label>
                  <input
                    type="text"
                    placeholder="Ej: 45 min / 1 hora"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Minutos para Agenda</label>
                  <select
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: 'white' }}
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (60 min)</option>
                    <option value={90}>1 hora 30 min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                  Cupos Simultáneos para este Servicio (Especialistas / Sillas)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={parallelSlots}
                  onChange={(e) => setParallelSlots(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Cuántos clientes pueden recibir este servicio al mismo tiempo (ej: 1 para VIP / 2 para limpieza estándar).
                </span>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span>Servicio Activo y Disponible para Reservas</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {saving ? 'Guardando...' : (editingService ? 'Actualizar' : 'Crear Servicio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
