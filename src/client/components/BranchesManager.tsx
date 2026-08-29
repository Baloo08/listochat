import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';
import { Building2, Plus, Edit2, Trash2, MapPin, Phone, CheckCircle, Smartphone, AlertCircle, X } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  sinpePhone?: string;
  sinpeName?: string;
  latitude?: number;
  longitude?: number;
  isMain: boolean;
  active: boolean;
  createdAt?: string;
}

export default function BranchesManager() {
  const api = useApi();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    sinpePhone: '',
    sinpeName: '',
    isMain: false,
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/branches');
      if (Array.isArray(data)) {
        setBranches(data);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        phone: branch.phone || '',
        sinpePhone: branch.sinpePhone || '',
        sinpeName: branch.sinpeName || '',
        isMain: branch.isMain || false,
        active: branch.active !== false
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        sinpePhone: '',
        sinpeName: '',
        isMain: branches.length === 0, // default to main if first branch
        active: true
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre de la sucursal es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingBranch) {
        await api.put(`/api/branches/${editingBranch.id}`, formData);
      } else {
        await api.post('/api/branches', formData);
      }
      setShowModal(false);
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Error al guardar sucursal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la sucursal "${name}"?`)) return;
    try {
      await api.del(`/api/branches/${id}`);
      loadBranches();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={26} color="var(--primary)" />
            Sucursales & Franquicias
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Administra tus puntos de venta físicos, teléfonos SINPE propios por sede y asignación de pedidos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {/* Info Alert */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#1e40af',
        fontSize: '0.88rem'
      }}>
        <Building2 size={22} style={{ flexShrink: 0 }} />
        <div>
          <strong>Modo Multi-Sede Inteligente:</strong> Cuando registras 2 o más sucursales activas, tu tienda en línea y WhatsApp habilitan automáticamente el selector de sedes y cálculo de entrega hacia la sucursal más cercana.
        </div>
      </div>

      {/* Branches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando sucursales...</div>
      ) : branches.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '48px 24px',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          border: '1px solid var(--border)'
        }}>
          <Building2 size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No tienes sucursales registradas</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Actualmente tu negocio opera con la configuración principal. Agrega tu primera sede para activar el control multi-sucursal.
          </p>
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Registrar Sede Principal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {branches.map(branch => (
            <div
              key={branch.id}
              className="hover-card"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>{branch.name}</h3>
                    {branch.isMain && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: '800'
                      }}>
                        MATRIZ
                      </span>
                    )}
                  </div>
                  {branch.code && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Código: {branch.code}
                    </span>
                  )}
                </div>

                <span style={{
                  padding: '3px 8px',
                  backgroundColor: branch.active ? '#dcfce7' : '#fee2e2',
                  color: branch.active ? '#15803d' : '#b91c1c',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {branch.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {branch.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={15} color="#10b981" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.sinpePhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={15} color="#8b5cf6" />
                    <span>SINPE: <strong>{branch.sinpePhone}</strong> ({branch.sinpeName || 'Mismo titular'})</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleOpenModal(branch)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text)',
                    fontWeight: '600',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={14} />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => handleDelete(branch.id, branch.name)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #fee2e2',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef4444',
                    fontWeight: '600',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Eliminar sucursal"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px' }}>
              {error && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    Nombre de la Sucursal / Sede *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sede Escazú / Centro Comercial..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      Código / Identificador
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: SJO-01"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      Teléfono Directo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2288-0000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    Dirección Física / Señas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: 100m norte del parque central, local #4"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>
                    💳 SINPE Móvil Específico para esta Sede (Opcional)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Teléfono SINPE"
                        value={formData.sinpePhone}
                        onChange={e => setFormData({ ...formData, sinpePhone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nombre Titular"
                        value={formData.sinpeName}
                        onChange={e => setFormData({ ...formData, sinpeName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', paddingTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isMain}
                      onChange={e => setFormData({ ...formData, isMain: e.target.checked })}
                    />
                    <span>Es la Sede Matriz / Principal</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span>Sede Activa</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
