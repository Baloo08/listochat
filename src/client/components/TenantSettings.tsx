import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Bot, Save, Key, Sliders, CheckCircle2, Sparkles } from 'lucide-react';

export default function TenantSettings() {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const api = useApi();

  const models: Record<string, string[]> = {
    gemini: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.7-flash', 'gemini-2.5-pro', 'gemini-flash-latest'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    anthropic: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022']
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/api/agent/prompt');
        if (data) {
          if (data.model) setModel(data.model);
          if (data.temperature !== undefined) setTemperature(data.temperature);
        }
      } catch (err) {
        console.error('Error fetching agent settings:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/agent/prompt', {
        model,
        temperature,
        ...(apiKey ? { apiKey, provider } : {})
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error guardando configuración: ' + (err.message || 'Verifique los datos'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', backgroundColor: 'var(--surface)', padding: '28px', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Bot size={24} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Motor de Inteligencia Artificial (Betico AI)</h3>
      </div>
      <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Configura el modelo neuronal y las credenciales que utilizará Betico para atender a los clientes por WhatsApp y generar descripciones
      </p>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
          <CheckCircle2 size={18} /> ¡Configuración guardada exitosamente!
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>Proveedor de Inteligencia Artificial</label>
          <select 
            value={provider} 
            onChange={(e) => {
              const p = e.target.value;
              setProvider(p);
              setModel(models[p][0]);
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem' }}
          >
            <option value="gemini">Google Gemini (Recomendado - 2.5 Flash / Flash Lite)</option>
            <option value="openai">OpenAI (GPT-4o Mini / GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude 3.5)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>Modelo Neuronal</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem' }}
          >
            {models[provider]?.map(m => (
              <option key={m} value={m}>{m} {m === 'gemini-2.5-flash' ? '⚡ (Más Rápido & Preciso)' : m === 'gemini-2.5-flash-lite' ? '🍃 (Ultra Ligero)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
            API Key Personalizada (Opcional)
          </label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            placeholder="Dejar en blanco para usar la clave por defecto de la plataforma"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Si tienes tu propia API Key de Google AI Studio u OpenAI, puedes ingresarla aquí.
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Creatividad / Temperatura: {temperature}</label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{temperature <= 0.3 ? 'Preciso' : temperature >= 0.8 ? 'Muy Creativo' : 'Balanceado'}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button 
          onClick={handleSave}
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
        >
          <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Configuración IA'}
        </button>
      </div>
    </div>
  );
}
