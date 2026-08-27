import React, { useState, useEffect } from 'react';
import { Phone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EvolutionManager() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/evolution/status', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.status === 'qrcode' && data.qrcode) {
          setQrCode(data.qrcode);
        } else {
          setQrCode(null);
        }
      }
    } catch (error) {
      console.error('Error fetching evolution status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/evolution/connect', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Error connecting to evolution:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/evolution/disconnect', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Error disconnecting from evolution:', error);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Phone size={24} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Conexión WhatsApp</h2>
      </div>

      {loading && !status ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Comprobando estado...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Estado de Conexión</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: status?.status === 'connected' ? 'green' : 'gray', marginTop: '5px' }}>
                {status?.status === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
                {status?.status === 'connected' ? 'Conectado' : (status?.status === 'qrcode' ? 'Generando QR...' : 'Desconectado')}
              </div>
            </div>
            
            {status?.status === 'connected' ? (
              <button onClick={handleDisconnect} style={{ padding: '8px 15px', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Desconectar
              </button>
            ) : (
              <button onClick={handleConnect} style={{ padding: '8px 15px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <RefreshCw size={16} /> Conectar WhatsApp
              </button>
            )}
          </div>

          {qrCode && status?.status !== 'connected' && (
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ marginBottom: '15px' }}>Escanea este código QR con tu aplicación de WhatsApp (Dispositivos Vinculados)</p>
              <QRCodeSVG value={qrCode} size={250} />
            </div>
          )}

          {status && status.instanceName && (
            <div style={{ padding: '15px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Información de Instancia</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Instancia:</span>
                <span>{status.instanceName}</span>
                <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                <span>{status.phoneNumber || 'N/A'}</span>
                <span style={{ color: 'var(--text-muted)' }}>Servidor:</span>
                <span>{status.serverUrl || 'Evolution API'}</span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
