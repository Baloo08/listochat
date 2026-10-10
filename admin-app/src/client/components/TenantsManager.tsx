import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function TenantsManager() {
  const api = useAdminApi();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'starter',
    adminEmail: '',
    whatsappNumber: '',
    customMonthlyPrice: 0,
    billingCurrency: 'CRC'
  });
  const [editData, setEditData] = useState<any>({});
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/tenants');
      setTenants(data || []);
    } catch (e: any) {
      alert('Error cargando comercios: ' + (e.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/api/tenants', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        plan: 'starter',
        adminEmail: '',
        whatsappNumber: '',
        customMonthlyPrice: 0,
        billingCurrency: 'CRC'
      });
      showToast(`Comercio creado con éxito. Contraseña temporal: ${res.tempPassword}`);
      await fetchTenants();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo crear el comercio'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      await api.put(`/api/tenants/${selectedTenant.id}`, editData);
      setShowEditModal(false);
      showToast('Comercio actualizado correctamente');
      await fetchTenants();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo actualizar'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !newPassword) return;
    setActionLoading(true);
    try {
      await api.post(`/api/tenants/${selectedTenant.id}/reset-password`, { newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      showToast('Contraseña restablecida con éxito');
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo restablecer la contraseña'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (t: any) => {
    if (!confirm(`¿Estás COMPLETAMENTE SEGURO de eliminar definitivamente "${t.name}"? Esta acción borrará todas sus órdenes, productos y chats.`)) return;
    try {
      await api.del(`/api/tenants/${t.id}`);
      showToast('Comercio eliminado');
      await fetchTenants();
    } catch (err: any) {
      alert('Error al eliminar comercio: ' + (err.message || 'Error'));
    }
  };

  const handleImpersonate = async (t: any) => {
    try {
      const res = await api.post(`/api/tenants/${t.id}/impersonate`);
      if (res.launchUrl) {
        window.open(res.launchUrl, '_blank');
      }
    } catch (err: any) {
      alert('Error al entrar al portal: ' + (err.message || 'Error'));
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const term = search.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(term) ||
      t.slug.toLowerCase().includes(term) ||
      (t.adminEmail && t.adminEmail.toLowerCase().includes(term)) ||
      (t.whatsappNumber && t.whatsappNumber.includes(term));
    const matchPlan = filterPlan === 'all' || t.plan === filterPlan;
    const matchActive =
      filterActive === 'all' ||
      (filterActive === 'active' && t.active) ||
      (filterActive === 'inactive' && !t.active);
    return matchSearch && matchPlan && matchActive;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid #34D399',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        backgroundColor: '#0f2426',
        border: '1px solid #1a3e40',
        borderRadius: '16px',
        padding: '20px 24px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#FAF8F5', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#34D399" />
            Gestión de Negocios e Inquilinos
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Total registrados: <strong>{tenants.length}</strong> comercios
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              borderRadius: '8px',
              color: '#FAF8F5',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(52, 211, 153, 0.2)'
            }}
          >
            <Plus size={16} />
            Nuevo Comercio
          </button>

          <button
            onClick={fetchTenants}
            style={{
              padding: '10px 14px',
              backgroundColor: '#123032',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              color: '#FAF8F5',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, slug, email o WhatsApp..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '8px',
              color: '#FAF8F5',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '8px',
            color: '#FAF8F5',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="all">Todos los Planes</option>
          <option value="starter">Plan Starter</option>
          <option value="pro">Plan Pro</option>
          <option value="business">Plan Business</option>
          <option value="enterprise">Plan Enterprise</option>
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '8px',
            color: '#FAF8F5',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="all">Todos los Estados</option>
          <option value="active">Solo Activos</option>
          <option value="inactive">Solo Inactivos</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div style={{
        backgroundColor: '#0f2426',
        border: '1px solid #1a3e40',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a1a1c', borderBottom: '1px solid #1a3e40', color: '#94a3b8' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Comercio</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Plan y Precio</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Admin Principal</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>WhatsApp</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron comercios registrados
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #142e30', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#FAF8F5', fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>slug: {t.slug}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#16383b',
                        color: '#FAF8F5',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        marginBottom: '4px'
                      }}>
                        {t.plan}
                      </span>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {t.billingCurrency === 'USD' ? `$${t.customMonthlyPrice || 0}` : `₡${Number(t.customMonthlyPrice || 0).toLocaleString()}`} / mes
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: '#FAF8F5' }}>{t.adminEmail}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: t.whatsappNumber ? '#34D399' : '#64748b', fontWeight: 600 }}>
                        {t.whatsappNumber || 'Sin asignar'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: t.active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(181, 28, 18, 0.15)',
                        color: t.active ? '#34D399' : '#f87171'
                      }}>
                        {t.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleImpersonate(t)}
                          title="Entrar al Portal del Cliente"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#0B3C3D',
                            border: '1px solid #34D399',
                            borderRadius: '6px',
                            color: '#FAF8F5',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ExternalLink size={12} />
                          Entrar
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setEditData({
                              name: t.name,
                              slug: t.slug,
                              plan: t.plan,
                              active: t.active,
                              whatsappNumber: t.whatsappNumber || '',
                              customMonthlyPrice: t.customMonthlyPrice || 0,
                              billingCurrency: t.billingCurrency || 'CRC',
                              adminEmail: t.adminEmail
                            });
                            setShowEditModal(true);
                          }}
                          title="Editar Comercio"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#123032',
                            border: '1px solid #234b4e',
                            borderRadius: '6px',
                            color: '#FAF8F5',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={12} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setShowPasswordModal(true);
                          }}
                          title="Resetear Contraseña de Administrador"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#123032',
                            border: '1px solid #234b4e',
                            borderRadius: '6px',
                            color: '#facc15',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Key size={12} />
                        </button>

                        <button
                          onClick={() => handleDelete(t)}
                          title="Eliminar Comercio"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'rgba(181, 28, 18, 0.2)',
                            border: '1px solid rgba(181, 28, 18, 0.4)',
                            borderRadius: '6px',
                            color: '#fca5a5',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Comercio */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#FAF8F5' }}>
              Registrar Nuevo Comercio
            </h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Cafetería Central"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Slug (identificador único URL)</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
                  placeholder="cafeteria-central"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Moneda</label>
                  <select
                    value={formData.billingCurrency}
                    onChange={(e) => setFormData({ ...formData, billingCurrency: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                  >
                    <option value="CRC">Colones (CRC)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Precio Mensual Acordado</label>
                <input
                  type="number"
                  value={formData.customMonthlyPrice}
                  onChange={(e) => setFormData({ ...formData, customMonthlyPrice: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Correo de Acceso del Administrador</label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@cafeteriacentral.cr"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Número de WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="50688888888"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#123032', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#0B3C3D', border: '1px solid #34D399', borderRadius: '8px', color: '#FAF8F5', fontWeight: 700, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Guardando...' : 'Crear Comercio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Comercio */}
      {showEditModal && selectedTenant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#FAF8F5' }}>
              Editar Comercio: {selectedTenant.name}
            </h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Slug</label>
                <input
                  type="text"
                  required
                  value={editData.slug || ''}
                  onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Plan</label>
                  <select
                    value={editData.plan || 'starter'}
                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Estado</label>
                  <select
                    value={editData.active ? 'true' : 'false'}
                    onChange={(e) => setEditData({ ...editData, active: e.target.value === 'true' })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo / Suspendido</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>Correo de Administrador</label>
                <input
                  type="email"
                  value={editData.adminEmail || ''}
                  onChange={(e) => setEditData({ ...editData, adminEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>WhatsApp</label>
                <input
                  type="text"
                  value={editData.whatsappNumber || ''}
                  onChange={(e) => setEditData({ ...editData, whatsappNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#123032', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#0B3C3D', border: '1px solid #34D399', borderRadius: '8px', color: '#FAF8F5', fontWeight: 700, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resetear Contraseña */}
      {showPasswordModal && selectedTenant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#FAF8F5' }}>
              Restablecer Contraseña
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Para el administrador de: <strong>{selectedTenant.name}</strong> ({selectedTenant.adminEmail})
            </p>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  Nueva Contraseña Temporal (mínimo 6 caracteres)
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ej: Temporal2026!"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#091819', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#123032', border: '1px solid #234b4e', borderRadius: '8px', color: '#FAF8F5', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#0B3C3D', border: '1px solid #34D399', borderRadius: '8px', color: '#FAF8F5', fontWeight: 700, cursor: 'pointer' }}
                >
                  {actionLoading ? 'Guardando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
