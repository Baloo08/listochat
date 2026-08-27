import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Users, Plus, Trash2, Edit, Shield, UserCheck, UserX, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [saving, setSaving] = useState(false);

  const api = useApi();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/users');
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'staff' });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        await api.post('/api/users', formData);
      }
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      alert('Error guardando usuario: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el usuario "${name}"?`)) {
      try {
        await api.del(`/api/users/${id}`);
        await loadUsers();
      } catch (err: any) {
        alert('Error al eliminar usuario');
      }
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Equipo y Colaboradores</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los usuarios que tienen acceso al panel de tu negocio</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          style={{ padding: '9px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={16} /> Invitar Usuario
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NOMBRE</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CORREO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ROL</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ESTADO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay otros usuarios en este negocio.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '10px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      backgroundColor: u.role === 'admin' ? '#e0e7ff' : '#f1f5f9',
                      color: u.role === 'admin' ? '#3730a3' : '#475569',
                      textTransform: 'uppercase'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '10px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      backgroundColor: u.active !== false ? '#dcfce7' : '#fee2e2',
                      color: u.active !== false ? '#166534' : '#991b1b'
                    }}>
                      {u.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '8px' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id, u.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                {editingUser ? `Editar Usuario: ${editingUser.name}` : 'Invitar Nuevo Colaborador'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="ej: María Vargas"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  placeholder="colaborador@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña Inicial'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Rol en el Sistema</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                >
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="staff">Staff / Operador (Atención de Citas y Órdenes)</option>
                  <option value="viewer">Visualizador (Solo Lectura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 16px', border: '1px solid var(--border)', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
