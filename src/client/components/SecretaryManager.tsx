import React, { useState, useEffect } from 'react';
import { Shield, Plus, Phone, User, Key, Trash2, CheckCircle2, AlertTriangle, Lock, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface SecretaryPhone {
  id: string;
  phone: string;
  name: string;
  role: 'owner' | 'manager' | 'receptionist';
  failedAttempts: number;
  lockedUntil: string | null;
  active: boolean;
  createdAt: string;
}

export const SecretaryManager: React.FC = () => {
  const api = useApi();
  const [phones, setPhones] = useState<SecretaryPhone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'owner' | 'manager' | 'receptionist'>('owner');
  const [formPin, setFormPin] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchPhones = async () => {
    try {
      setLoading(true);
      const [phonesData, quotaData] = await Promise.all([
        api.get('/api/secretary/phones'),
        api.get('/api/agent/ai-quota').catch(() => null)
      ]);
      setPhones(Array.isArray(phonesData) ? phonesData : []);
      if (quotaData && quotaData.success) {
        setQuotaInfo(quotaData);
      }
    } catch (err) {
      console.error('Error fetching secretary phones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhones();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formPhone.trim() || !formPin.trim()) {
      setFormError('Por favor completa todos los campos.');
      return;
    }

    if (!/^\d{4}$/.test(formPin.trim())) {
      setFormError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    try {
      setFormSubmitting(true);
      await api.post('/api/secretary/phones', {
        name: formName.trim(),
        phone: formPhone.trim(),
        role: formRole,
        pin: formPin.trim()
      });

      setShowModal(false);
      setFormName('');
      setFormPhone('');
      setFormPin('');
      setSuccessToast('¡Secretario autorizado registrado exitosamente!');
      setTimeout(() => setSuccessToast(''), 4000);
      fetchPhones();
    } catch (err: any) {
      setFormError(err?.message || 'Error registrando secretario.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${name} de los secretarios autorizados?`)) {
      return;
    }
    try {
      await api.del(`/api/secretary/phones/${id}`);
      setSuccessToast('Secretario eliminado correctamente.');
      setTimeout(() => setSuccessToast(''), 4000);
      fetchPhones();
    } catch (err: any) {
      alert(err?.message || 'Error eliminando secretario.');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.put(`/api/secretary/phones/${id}`, { active: !currentActive });
      fetchPhones();
    } catch (err: any) {
      alert(err?.message || 'Error actualizando estado.');
    }
  };

  const isByokConfigured = quotaInfo?.isUsingOwnKey === true;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#f5f3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Secretario Virtual por WhatsApp (Acceso Interno)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Atiende a administradores y dueños con funciones operativas exclusivas protegidas con PIN
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Agregar Secretario
        </button>
      </div>

      {/* BYOK Status Banner */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: isByokConfigured ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${isByokConfigured ? '#bbf7d0' : '#fef3c7'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isByokConfigured ? (
            <CheckCircle2 size={20} color="#16a34a" />
          ) : (
            <AlertTriangle size={20} color="#d97706" />
          )}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isByokConfigured ? '#166534' : '#92400e'
            }}>
              {isByokConfigured
                ? 'Clave Propia (BYOK) Conectada y Activa'
                : 'Requisito BYOK Pendiente para el Secretario'}
            </div>
            <div style={{
              fontSize: '12px',
              color: isByokConfigured ? '#15803d' : '#b45309',
              marginTop: '2px'
            }}>
              {isByokConfigured
                ? `El Secretario procesa consultas mediante tu proveedor (${quotaInfo?.provider || 'IA'}) con privacidad total y sin límites de cuota.`
                : 'Para que el Secretario y el Asesor respondan por IA, debes configurar tu propia API Key en Ajustes > Inteligencia Artificial.'}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Explanatory Notes */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#475569',
        lineHeight: '1.5'
      }}>
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="#7c3aed" />
          ¿Cómo funciona el Secretario Virtual?
        </div>
        <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
          <li>Cuando un número autorizado le escribe al WhatsApp del negocio, el sistema no lo trata como un cliente común.</li>
          <li>En el primer mensaje de la jornada se solicita el <strong>PIN de 4 dígitos</strong> para validar la sesión de 24 horas.</li>
          <li>El secretario puede consultar la agenda del día, ver canchas, agendar citas en nombre de clientes y ver ingresos.</li>
          <li><strong>Independencia total:</strong> Puede estar activo aunque la atención de clientes por IA esté desactivada.</li>
        </ul>
      </div>

      {successToast && (
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {successToast}
        </div>
      )}

      {/* Table of Authorized Phones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '14px' }}>
          Cargando secretarios autorizados...
        </div>
      ) : phones.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <Lock size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#334155' }}>No hay secretarios autorizados</h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
            Registra tu número de WhatsApp personal para gestionar tu negocio como asistente interno.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Agregar Primer Secretario
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Teléfono WhatsApp</th>
                <th style={{ padding: '12px 16px' }}>Rol</th>
                <th style={{ padding: '12px 16px' }}>Seguridad PIN</th>
                <th style={{ padding: '12px 16px' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {phones.map((p) => {
                const isLocked = p.lockedUntil && new Date(p.lockedUntil) > new Date();
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#64748b" />
                        {p.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#64748b" />
                        +{p.phone}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: p.role === 'owner' ? '#f5f3ff' : p.role === 'manager' ? '#eff6ff' : '#f1f5f9',
                        color: p.role === 'owner' ? '#7c3aed' : p.role === 'manager' ? '#2563eb' : '#475569'
                      }}>
                        {p.role === 'owner' ? 'Dueño' : p.role === 'manager' ? 'Administrador' : 'Recepcionista'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isLocked ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={13} /> Bloqueado (15 min)
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Key size={13} /> Protegido con PIN
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleActive(p.id, p.active)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: p.active ? '#dcfce7' : '#fee2e2',
                          color: p.active ? '#15803d' : '#991b1b'
                        }}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title="Eliminar secretario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar Secretario */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Registrar Secretario Autorizado
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Este número podrá interactuar con el bot como administrador interno.
            </p>

            {formError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Murillo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Teléfono WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 88888888 o 50688888888"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Se normalizará automáticamente con código de país 506.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Rol Operativo
                </label>
                <select
                  value={formRole}
                  onChange={(e: any) => setFormRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  <option value="owner">Dueño / Gerente General</option>
                  <option value="manager">Administrador Operativo</option>
                  <option value="receptionist">Recepcionista / Asistente</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Código PIN de 4 Dígitos
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  inputMode="numeric"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '16px',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  El secretario deberá digitar este PIN cada día para desbloquear el acceso.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {formSubmitting ? 'Guardando...' : 'Registrar Secretario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SecretaryManager;
