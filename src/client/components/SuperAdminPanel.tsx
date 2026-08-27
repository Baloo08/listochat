import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Edit, Trash2, Plus, Building2, ExternalLink, ShieldCheck, KeyRound, ArrowLeft, Activity, Users, Settings } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  whatsappNumber?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userName?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function SuperAdminPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'audit'>('tenants');
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'starter',
    adminEmail: '',
    adminPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const api = useApi();

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/tenants');
      if (Array.isArray(data)) {
        setTenants(data);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const data = await api.get('/api/audit-logs?limit=50');
      if (data && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleNameChange = (val: string) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug
    }));
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTenant) {
        await api.put(`/api/tenants/${editTenant.id}`, {
          name: formData.name,
          plan: formData.plan
        });
      } else {
        await api.post('/api/tenants', formData);
      }
      setShowModal(false);
      setEditTenant(null);
      setFormData({ name: '', slug: '', plan: 'starter', adminEmail: '', adminPassword: '' });
      await loadTenants();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (tenant: Tenant) => {
    setEditTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan || 'starter',
      adminEmail: '',
      adminPassword: ''
    });
    setShowModal(true);
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el negocio "${name}"? Esta acción borrará todos sus datos asociados.`)) {
      try {
        await api.del(`/api/tenants/${id}`);
        await loadTenants();
      } catch (err) {
        alert('Error al eliminar negocio');
      }
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    try {
      setImpersonating(true);
      const res = await api.post(`/api/tenants/${tenant.id}/impersonate`, {});
      if (res && res.token) {
        // Save original superadmin token to allow returning
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          localStorage.setItem('original_token', currentToken);
        }
        localStorage.setItem('token', res.token);
        localStorage.setItem('impersonated_tenant', tenant.name);
        window.location.reload();
      }
    } catch (err: any) {
      alert('Error al acceder al portal del cliente: ' + (err.message || 'Error del servidor'));
      setImpersonating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Panel Global de Administración (Betico)</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los negocios, suscripciones, soporte y auditoría de tu plataforma</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { setEditTenant(null); setFormData({ name: '', slug: '', plan: 'starter', adminEmail: '', adminPassword: '' }); setShowModal(true); }}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Registrar Nuevo Negocio
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('tenants')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tenants' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={18} /> Negocios e Inquilinos ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity size={18} /> Registro de Actividad y Logins
        </button>
      </div>

      {activeTab === 'tenants' ? (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NEGOCIO</th>
                <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>IDENTIFICADOR (SLUG)</th>
                <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PLAN</th>
                <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ESTADO</th>
                <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>ACCIONES & SOPORTE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando negocios...</td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay negocios registrados aún. ¡Registra el primero!</td>
                </tr>
              ) : (
                tenants.map(tenant => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="var(--primary)" />
                        {tenant.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                      <code>/{tenant.slug}</code>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        backgroundColor: tenant.plan === 'enterprise' ? '#fef3c7' : '#e0e7ff', 
                        color: tenant.plan === 'enterprise' ? '#92400e' : '#3730a3', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {tenant.plan || 'Starter'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        backgroundColor: tenant.active !== false ? '#dcfce7' : '#fee2e2', 
                        color: tenant.active !== false ? '#166534' : '#991b1b', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {tenant.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {tenant.slug !== 'superadmin' && (
                        <button
                          onClick={() => handleImpersonate(tenant)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            marginRight: '10px'
                          }}
                          title="Entrar al panel del cliente para darle soporte"
                        >
                          <KeyRound size={13} /> Entrar al Portal
                        </button>
                      )}

                      <a 
                        href={`/tienda/${tenant.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--primary)', marginRight: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      >
                        <ExternalLink size={14} /> Tienda
                      </a>

                      <button 
                        onClick={() => handleEditClick(tenant)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '8px', verticalAlign: 'middle' }}
                        title="Editar negocio"
                      >
                        <Edit size={16} />
                      </button>

                      {tenant.slug !== 'superadmin' && (
                        <button 
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', verticalAlign: 'middle' }}
                          title="Eliminar negocio"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>FECHA Y HORA</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>USUARIO</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ACCIÓN</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>IP / DETALLES</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando registros de auditoría...</td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay eventos registrados aún.</td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                      {log.userName || log.userEmail || 'Sistema'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        backgroundColor: log.action === 'login' ? '#dcfce7' : log.action.includes('failed') ? '#fee2e2' : '#e0e7ff',
                        color: log.action === 'login' ? '#166534' : log.action.includes('failed') ? '#991b1b' : '#3730a3'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {log.ipAddress || '—'} {log.details ? `· ${JSON.stringify(log.details)}` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', fontSize: '1.3rem', fontWeight: 'bold' }}>
              {editTenant ? `Editar Negocio: ${editTenant.name}` : 'Dar de Alta Nuevo Negocio'}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {editTenant ? 'Actualiza la información y el plan de suscripción de tu cliente.' : 'Crea el espacio, catálogo y usuario administrador para tu cliente en Betico.'}
            </p>

            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Nombre del Negocio</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Clínica Dental Sonrisas o Lavacar Express" 
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Slug / Sub-Ruta</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editTenant}
                    placeholder="ej: sonrisas" 
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: editTenant ? '#f1f5f9' : 'white' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>URL: /tienda/{formData.slug || 'slug'}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Plan de Suscripción</label>
                  <select 
                    value={formData.plan}
                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  >
                    <option value="starter">Starter (Básico)</option>
                    <option value="pro">Pro (Recomendado)</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {!editTenant && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
                    <ShieldCheck size={16} /> Credenciales de Acceso para el Cliente
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Correo del Cliente</label>
                      <input 
                        type="email" 
                        required
                        placeholder="admin@cliente.cr" 
                        value={formData.adminEmail}
                        onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Contraseña Inicial</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••" 
                        value={formData.adminPassword}
                        onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setEditTenant(null); }} 
                  style={{ padding: '9px 16px', border: '1px solid var(--border)', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {saving ? 'Guardando...' : editTenant ? 'Guardar Cambios' : 'Crear y Habilitar Negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
