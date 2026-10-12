import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Globe, Calendar, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface TimezoneDiagnostic {
  vpsUtcTime: string;
  vpsUtcHour: number;
  costaRicaLocalTime: string;
  costaRicaDate: string;
  costaRicaTime: string;
  costaRicaDayOfWeek: string;
  costaRicaDayNumber: number;
  offsetHours: number;
  offsetString: string;
  timezoneName: string;
  isNightShiftActive: boolean;
  nightShiftExplanation: string;
  status: string;
  statusMessage: string;
}

interface SimulationResult {
  simulatedNowCR: string;
  simulatedNowDate: string;
  simulatedNowTime: string;
  targetDate: string;
  targetTime: string;
  targetDayOfWeek: string;
  isPastDate: boolean;
  isPastSlot: boolean;
  isAllowedForBooking: boolean;
  verdict: string;
}

export const TimezoneSimulatorWidget: React.FC = () => {
  const api = useApi();
  const [diagnostic, setDiagnostic] = useState<TimezoneDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [simDate, setSimDate] = useState('');
  const [simTime, setSimTime] = useState('14:00');
  const [simCurrentHour, setSimCurrentHour] = useState('10');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchDiagnostic = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/timezone/diagnostic');
      setDiagnostic(data);
      if (!simDate && data?.costaRicaDate) {
        setSimDate(data.costaRicaDate);
      }
    } catch (err) {
      console.error('Error fetching timezone diagnostic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
    const interval = setInterval(fetchDiagnostic, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      setSimLoading(true);
      const res = await api.post('/api/timezone/simulate', {
        date: simDate,
        time: simTime,
        simulatedCurrentHour: parseInt(simCurrentHour, 10),
        simulatedCurrentMinute: 0
      });
      setSimResult(res);
    } catch (err) {
      console.error('Error running timezone simulation:', err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              Diagnóstico y Detección Horaria Oficial
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Sincronización en tiempo real con Costa Rica (America/Costa_Rica, UTC-6)
            </p>
          </div>
        </div>
        <button
          onClick={fetchDiagnostic}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Card 1: Costa Rica Time */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calendar size={16} color="#0284c7" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
              Costa Rica (UTC-6)
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            {diagnostic?.costaRicaTime || '--:--'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {diagnostic ? `${diagnostic.costaRicaDayOfWeek}, ${diagnostic.costaRicaDate}` : 'Cargando...'}
          </div>
        </div>

        {/* Card 2: Server VPS Time */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Globe size={16} color="#8b5cf6" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
              Servidor VPS (UTC)
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            {diagnostic?.vpsUtcTime ? diagnostic.vpsUtcTime.split('T')[1]?.slice(0, 5) : '--:--'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            {diagnostic ? `Offset: ${diagnostic.offsetString} horas` : 'Cargando...'}
          </div>
        </div>

        {/* Card 3: Boundary Guard Status */}
        <div style={{
          backgroundColor: diagnostic?.isNightShiftActive ? '#fffbeb' : '#f0fdf4',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${diagnostic?.isNightShiftActive ? '#fef3c7' : '#dcfce7'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={16} color={diagnostic?.isNightShiftActive ? '#d97706' : '#16a34a'} />
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: diagnostic?.isNightShiftActive ? '#b45309' : '#15803d',
              textTransform: 'uppercase'
            }}>
              Frontera 18:00 - 23:59
            </span>
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: diagnostic?.isNightShiftActive ? '#92400e' : '#166534'
          }}>
            {diagnostic?.isNightShiftActive ? 'Frontera Nocturna Activa' : 'Sincronización Perfecta'}
          </div>
          <div style={{
            fontSize: '12px',
            color: diagnostic?.isNightShiftActive ? '#b45309' : '#15803d',
            marginTop: '4px',
            lineHeight: '1.4'
          }}>
            {diagnostic?.isNightShiftActive
              ? 'UTC ya está en el día siguiente. Betico mantiene la fecha local de Costa Rica.'
              : 'UTC y Costa Rica operan en el mismo día sin discrepancias de calendario.'}
          </div>
        </div>
      </div>

      {/* Interactive Simulator Section */}
      <div style={{
        backgroundColor: '#f1f5f9',
        borderRadius: '12px',
        padding: '18px',
        border: '1px solid #cbd5e1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Play size={16} color="#2563eb" />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
            Simulador de Validación de Horarios y Reservas
          </h4>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#475569' }}>
          Prueba cómo evalúa el sistema un turno solicitado en cualquier hora del día para verificar que nunca se acepten horas pasadas ni se desplace la fecha.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
              Fecha a Evaluar
            </label>
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
              Hora Solicitada
            </label>
            <input
              type="time"
              value={simTime}
              onChange={(e) => setSimTime(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
              Simular Hora Actual (CR)
            </label>
            <select
              value={simCurrentHour}
              onChange={(e) => setSimCurrentHour(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="9">09:00 AM (Mañana)</option>
              <option value="12">12:00 PM (Mediodía)</option>
              <option value="15">03:00 PM (Tarde)</option>
              <option value="18">06:00 PM (Inicio Noche)</option>
              <option value="21">09:00 PM (Noche Avanzada)</option>
              <option value="23">11:30 PM (Frontera Crítica)</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleSimulate}
              disabled={simLoading}
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {simLoading ? 'Evaluando...' : 'Evaluar Turno'}
            </button>
          </div>
        </div>

        {/* Simulation Output */}
        {simResult && (
          <div style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: simResult.isAllowedForBooking ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${simResult.isAllowedForBooking ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            {simResult.isAllowedForBooking ? (
              <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: simResult.isAllowedForBooking ? '#166534' : '#991b1b'
              }}>
                {simResult.isAllowedForBooking ? 'Turno Válido para Agendamiento' : 'Turno Bloqueado por Horario Pasado'}
              </div>
              <div style={{
                fontSize: '13px',
                color: simResult.isAllowedForBooking ? '#15803d' : '#b91c1c',
                marginTop: '3px'
              }}>
                {simResult.verdict}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Hora simulada del sistema: {simResult.simulatedNowDate} a las {simResult.simulatedNowTime} CR | Día de la semana: {simResult.targetDayOfWeek}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TimezoneSimulatorWidget;
