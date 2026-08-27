import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus, Edit2, Trash2 } from 'lucide-react';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  serviceName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export default function Bookings() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#f59e0b'; // amber
      case 'confirmed': return '#3b82f6'; // blue
      case 'completed': return '#10b981'; // green
      case 'cancelled': return '#ef4444'; // red
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestión de Reservas</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmados</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            <Plus size={18} /> Nueva Reserva
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay reservas encontradas.</div>
          ) : (
            filteredAppointments.map(appointment => (
              <div key={appointment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'flex', gap: '30px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                      <User size={16} /> {appointment.customerName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{appointment.customerPhone}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarIcon size={16} /> {appointment.date}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Clock size={16} /> {appointment.time}
                    </div>
                  </div>
                  <div>
                    <div>{appointment.serviceName}</div>
                    <div style={{ fontWeight: 'bold' }}>${appointment.amount}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    color: 'white',
                    backgroundColor: getStatusColor(appointment.status)
                  }}>
                    {getStatusLabel(appointment.status)}
                  </span>
                  
                  <select 
                    value={appointment.status}
                    onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  >
                    <option value="pending">Marcar Pendiente</option>
                    <option value="confirmed">Confirmar</option>
                    <option value="completed">Completar</option>
                    <option value="cancelled">Cancelar</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
