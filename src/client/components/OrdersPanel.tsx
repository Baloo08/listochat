import React, { useState } from 'react';
import { Eye, CheckCircle, Clock } from 'lucide-react';

export default function OrdersPanel() {
  const [orders] = useState([
    { id: 'ORD-001', customer: 'Juan Pérez', total: 25.50, status: 'pending', payment_status: 'pending', source: 'whatsapp', date: '2023-10-27 14:30' },
    { id: 'ORD-002', customer: 'María Gómez', total: 15.00, status: 'completed', payment_status: 'paid', source: 'store', date: '2023-10-27 12:15' }
  ]);

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Gestión de Órdenes</h2>
      
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Orden</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Cliente</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Fecha</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Total</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Pago</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{order.id}</td>
                <td style={{ padding: '12px 16px' }}>{order.customer}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{order.date}</td>
                <td style={{ padding: '12px 16px', fontWeight: '600' }}>${order.total.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7', color: order.status === 'completed' ? '#166534' : '#b45309', borderRadius: '12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {order.status === 'completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {order.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: order.payment_status === 'paid' ? '#dcfce7' : '#fee2e2', color: order.payment_status === 'paid' ? '#166534' : '#991b1b', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {order.payment_status === 'pending' && (
                    <button style={{ padding: '4px 8px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', marginRight: '10px' }}>
                      Confirmar Pago
                    </button>
                  )}
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)' }}><Eye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
