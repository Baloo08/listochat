import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Phone, CheckCircle, RefreshCw, AlertCircle, LogOut, QrCode } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function EvolutionManager() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qrcode' | 'connected'>('disconnected');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const pollTimerRef = useRef<any>(null);

  const api = useApi();

  const fetchStatus = async () => {
    try {
      const data = await api.get('/api/evolution/status');
      if (data) {
        setInstanceName(data.instanceName || '');
        setWhatsappNumber(data.whatsappNumber || '');

        if (data.status === 'connected' || data.status === 'open') {
          setStatus('connected');
          setQrCodeData(null);
        } else if (data.status === 'qrcode' && data.qrcode) {
          setStatus('qrcode');
          setQrCodeData(data.qrcode);
          if (data.pairingCode) setPairingCode(data.pairingCode);
        } else {
          setStatus('disconnected');
        }
      }
    } catch (err) {
      console.error('Error fetching evolution status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll every 4 seconds to check if status changes to connected
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await api.post('/api/evolution/connect', {});
      if (data) {
        if (data.status === 'qrcode' && data.qrcode) {
          setStatus('qrcode');
          setQrCodeData(data.qrcode);
          if (data.pairingCode) setPairingCode(data.pairingCode);
        } else if (data.status === 'connected' || data.status === 'open') {
          setStatus('connected');
        } else {
          setStatus('connecting');
        }
      }
    } catch (error) {
      alert('Error al iniciar conexión con WhatsApp. Por favor verifica que Evolution API esté activo.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar el número de WhatsApp? El bot dejará de responder automáticamente hasta que vuelvas a vincularlo.')) {
      return;
    }
    try {
      await api.post('/api/evolution/disconnect', {});
      setStatus('disconnected');
      setQrCodeData(null);
      setPairingCode(null);
      await fetchStatus();
    } catch (error) {
      alert('Error al desconectar');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verificando conexión con WhatsApp...</div>;
  }

  return (
    <div style={{ maxWidth: '750px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Conexión de WhatsApp</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Vincula el número de WhatsApp de tu negocio para que Betico AI responda automáticamente a tus clientes
        </p>
      </div>

      {status === 'connected' ? (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '25px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
            <CheckCircle size={36} color="#166534" />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#166534', fontWeight: 'bold' }}>
            ¡WhatsApp Vinculado y Operativo!
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#15803d', fontSize: '0.9rem' }}>
            Tu asistente virtual con IA está atendiendo a los clientes en tiempo real.
          </p>

          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px', backgroundColor: 'white', padding: '12px 20px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '25px', fontSize: '0.9rem' }}>
            <div><strong>Instancia:</strong> <code>{instanceName || 'tenant_instance'}</code></div>
            {whatsappNumber && <div><strong>Número:</strong> {whatsappNumber}</div>}
          </div>

          <div>
            <button 
              onClick={handleDisconnect}
              style={{ padding: '9px 18px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}
            >
              <LogOut size={16} /> Desconectar WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '30px', textAlign: 'center' }}>
          {status === 'qrcode' && qrCodeData ? (
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Escanea el Código QR con tu WhatsApp
              </h3>
              <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', marginInline: 'auto' }}>
                Abre WhatsApp en tu teléfono ➔ Menú / Configuración ➔ Dispositivos vinculados ➔ Vincular un dispositivo:
              </p>

              <div style={{ display: 'inline-block', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                {qrCodeData.startsWith('data:image') ? (
                  <img src={qrCodeData} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px', display: 'block' }} />
                ) : (
                  <QRCodeSVG value={qrCodeData} size={250} level="M" />
                )}
              </div>

              {pairingCode && (
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Código de vinculación alternativo: </span>
                  <strong style={{ fontSize: '1.1rem', letterSpacing: '2px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>{pairingCode}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button 
                  onClick={handleConnect} 
                  disabled={connecting}
                  style={{ padding: '8px 16px', backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={15} /> Actualizar Código QR
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                <QrCode size={30} color="var(--text-muted)" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                WhatsApp no está conectado
              </h3>
              <p style={{ margin: '0 0 25px 0', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', marginInline: 'auto' }}>
                Conecta tu número para que Betico empiece a agendar citas, tomar pedidos y responder dudas automáticamente.
              </p>

              <button 
                onClick={handleConnect}
                disabled={connecting}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#16a34a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1rem',
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                }}
              >
                <Phone size={18} /> {connecting ? 'Generando código QR...' : 'Conectar WhatsApp Ahora'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
