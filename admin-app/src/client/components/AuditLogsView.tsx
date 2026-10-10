import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Clock } from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function AuditLogsView() {
  const api = useAdminApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/api/audit/logs?search=${encodeURIComponent(search)}&limit=100`);
      setLogs(data || []);
    } catch (e: any) {
      console.warn('Error al cargar logs de auditoría:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
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
            <ShieldCheck size={24} color="#34D399" />
            Registro Global de Auditoría y Trazabilidad
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Trazabilidad inmutable de cambios administrativos, inicios de sesión y operaciones críticas
          </p>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            padding: '9px 16px',
            backgroundColor: '#123032',
            border: '1px solid #234b4e',
            borderRadius: '8px',
            color: '#FAF8F5',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar acción, usuario, correo o negocio..."
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

      {/* Logs Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha y Hora</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Acción</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Usuario / Autor</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Negocio Afectado</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron registros de auditoría
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #142e30' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#16383b',
                        color: '#34D399',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#FAF8F5' }}>
                      {log.userName || log.userEmail || 'Sistema'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      {log.tenantName || 'Global / SuperAdmin'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
