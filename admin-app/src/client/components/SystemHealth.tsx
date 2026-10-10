import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Database, Server, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function SystemHealth() {
  const api = useAdminApi();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.get('/api/system/stats');
      setStats(data);
    } catch (err) {
      console.warn('Error al consultar salud del sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#34D399' }} />
        <p>Cargando telemetría del servidor...</p>
      </div>
    );
  }

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
            <Server size={24} color="#34D399" />
            Salud y Telemetría del Sistema VPS
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Monitoreo en tiempo real de RAM, CPU, conexiones de PostgreSQL y estado de contenedores
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: '#34D399' }}
            />
            Auto-refrescar (5s)
          </label>

          <button
            onClick={fetchStats}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#123032',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              color: '#FAF8F5',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Resource Gauges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* RAM Usage */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} color="#34D399" />
                  Memoria RAM del VPS
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: stats.memory.percent > 85 ? '#f87171' : stats.memory.percent > 70 ? '#facc15' : '#34D399'
                }}>
                  {stats.memory.percent}% en uso
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: '10px',
                backgroundColor: '#091819',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${stats.memory.percent}%`,
                  backgroundColor: stats.memory.percent > 85 ? '#ef4444' : stats.memory.percent > 70 ? '#eab308' : '#34D399',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>Total: <strong>{(stats.memory.totalMb / 1024).toFixed(1)} GB</strong></span>
                <span>Usada: <strong>{(stats.memory.usedMb / 1024).toFixed(1)} GB</strong></span>
                <span>Libre: <strong>{(stats.memory.freeMb / 1024).toFixed(1)} GB</strong></span>
              </div>
            </div>

            {/* CPU & Load */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="#60a5fa" />
                  Procesador y Carga
                </span>
                <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                  {stats.cpu.cores} Cores ({stats.cpu.platform})
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#FAF8F5', fontWeight: 600, marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stats.cpu.model}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>Carga 1m: <strong>{stats.cpu.loadAvg[0]?.toFixed(2) || '0.00'}</strong></span>
                <span>Carga 5m: <strong>{stats.cpu.loadAvg[1]?.toFixed(2) || '0.00'}</strong></span>
                <span>Carga 15m: <strong>{stats.cpu.loadAvg[2]?.toFixed(2) || '0.00'}</strong></span>
              </div>
            </div>

            {/* Node Process & Uptime */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#facc15" />
                  Proceso Node.js
                </span>
                <span style={{ fontSize: '0.85rem', color: '#facc15', fontWeight: 700 }}>
                  Node {stats.process.nodeVersion}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <span>Heap Usada:</span>
                <strong>{stats.process.heapUsedMb} MB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <span>Heap Total:</span>
                <strong>{stats.process.heapTotalMb} MB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>Tiempo Activo (Uptime):</span>
                <strong>{formatUptime(stats.process.uptimeSeconds)}</strong>
              </div>
            </div>
          </div>

          {/* Database Health Section */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={20} color="#34D399" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FAF8F5', fontWeight: 700 }}>
                  PostgreSQL • Salud y Tamaño de Base de Datos
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                <span style={{ color: '#cbd5e1' }}>Tamaño Total: <strong style={{ color: '#34D399' }}>{stats.database.diskSize}</strong></span>
                <span style={{ color: '#cbd5e1' }}>Conexiones Activas: <strong style={{ color: '#60a5fa' }}>{stats.database.activeConnections}</strong></span>
              </div>
            </div>

            {/* Tables Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {stats.database.tables.map((t: any) => (
                <div
                  key={t.table}
                  style={{
                    backgroundColor: '#091819',
                    border: '1px solid #1a3e40',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {t.table}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FAF8F5' }}>
                    {t.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
