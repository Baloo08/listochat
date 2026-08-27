import React, { useState } from 'react';
import { Edit, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

export default function ProductManager() {
  const [products] = useState([
    { id: 1, name: 'Pizza Margarita', price: 12.99, stock: 50, active: true, category: 'Comida' },
    { id: 2, name: 'Coca Cola 2L', price: 3.50, stock: 100, active: true, category: 'Bebidas' }
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Productos</h2>
        <button style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', width: '50px' }}></th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Nombre</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Categoría</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Precio</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Stock</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={20} color="var(--text-muted)" />
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{product.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{product.category}</td>
                <td style={{ padding: '12px 16px' }}>${product.price.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>{product.stock}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: product.active ? '#dcfce7' : '#fee2e2', color: product.active ? '#166534' : '#991b1b', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {product.active ? 'Activo' : 'Inactivo'}
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
    </div>
  );
}
