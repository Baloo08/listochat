import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Betico ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: '#f8fafc'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#1e293b',
            padding: '36px 30px',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 8px 0', color: '#f8fafc' }}>
              Algo no cargó correctamente
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Hemos detectado un problema al cargar esta sección. Puedes recargar la página o volver a la portada.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#0b1120',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fca5a5',
                fontSize: '0.78rem',
                textAlign: 'left',
                fontFamily: 'monospace',
                marginBottom: '24px',
                wordBreak: 'break-all'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} /> Recargar Página
              </button>

              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} /> Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
