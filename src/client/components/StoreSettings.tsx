import React, { useState } from 'react';

export default function StoreSettings() {
  const [enabled, setEnabled] = useState(true);
  const [storeName, setStoreName] = useState('Mi Tienda');
  const [sinpePhone, setSinpePhone] = useState('8888-8888');
  const [sinpeName, setSinpeName] = useState('Juan Pérez');

  return (
    <div style={{ maxWidth: '600px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Configuración de Tienda Online</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{enabled ? 'Tienda Activa' : 'Tienda Inactiva'}</span>
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={() => setEnabled(!enabled)} 
            style={{ width: '40px', height: '20px', cursor: 'pointer' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nombre de la Tienda</label>
          <input 
            type="text" 
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Enlace Público</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={`https://tienda.miapp.com/${storeName.toLowerCase().replace(/\\s+/g, '-')}`}
              readOnly
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#f8fafc', color: 'var(--text-muted)' }}
            />
            <button style={{ padding: '10px 15px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>
              Copiar
            </button>
          </div>
        </div>

        <h4 style={{ margin: '10px 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>Configuración SINPE / Pagos</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Teléfono SINPE</label>
            <input 
              type="text" 
              value={sinpePhone}
              onChange={(e) => setSinpePhone(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Nombre a transferir</label>
            <input 
              type="text" 
              value={sinpeName}
              onChange={(e) => setSinpeName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
