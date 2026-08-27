import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  plan: string;
  status: string;
}

export default function SuperAdminPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const api = useApi();

  useEffect(() => {
    // Mock data for display
    setTenants([
      { id: '1', name: 'Barber Shop', slug: 'barber-shop', industry: 'salon', plan: 'pro', status: 'active' },
      { id: '2', name: 'Pizza Place', slug: 'pizza-place', industry: 'restaurant', plan: 'basic', status: 'active' }
    ]);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gestión de Inquilinos ({tenants.length})</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Nuevo Inquilino
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Nombre</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Slug</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Plan</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>{tenant.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{tenant.slug}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {tenant.plan}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {tenant.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', marginRight: '10px' }}><Edit size={18} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0 }}>Crear Inquilino</h3>
            {/* Form fields would go here */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid var(--border)', background: 'white', borderRadius: '4px' }}>Cancelar</button>
              <button style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
