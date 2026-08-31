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
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
    anthropic: ['claude-3-7-sonnet', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
  };

  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/api/agent/prompt');
        if (data) {
          if (data.model) {
            setModel(data.model);
            const known = Object.values(models).flat();
            if (!known.includes(data.model)) {
              setIsCustomModel(true);
              setCustomModelName(data.model);
            }
          }
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
      const finalModel = isCustomModel ? (customModelName.trim() || model) : model;
      await api.post('/api/agent/prompt', {
        model: finalModel,
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
    <div style={{ maxWidth: '750px', backgroundColor: 'var(--surface)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Bot size={24} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Motor de Inteligencia Artificial</h3>
      </div>
      <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
        Configura el proveedor y modelo de IA que atenderá a tus clientes por WhatsApp y generará descripciones para tus productos.
      </p>

      {/* Guide card to obtain API keys */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '22px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Key size={16} color="var(--primary)" /> ¿Dónde conseguir tu API Key?
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5' }}>
          Para que tu asistente funcione de forma privada, necesitas tu propia llave de API. Puedes obtener una gratuita o de pago en estos enlaces oficiales:
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700' }}
          >
            🟢 Google AI Studio (Gemini Gratis) ↗
          </a>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f3e8ff', color: '#7e22ce', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700' }}
          >
            🟣 OpenAI Platform (ChatGPT) ↗
          </a>
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffedd5', color: '#c2410c', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700' }}
          >
            🟠 Anthropic Console (Claude) ↗
          </a>
        </div>
      </div>

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
              setIsCustomModel(false);
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem' }}
          >
            <option value="gemini">Google Gemini (Recomendado - 2.5 Flash / Pro)</option>
            <option value="openai">OpenAI (GPT-4o / GPT-4o Mini / o1 / o3-mini)</option>
            <option value="anthropic">Anthropic (Claude 3.7 Sonnet / 3.5 Sonnet / 3.5 Haiku)</option>
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Modelo Neuronal</label>
            <button
              type="button"
              onClick={() => setIsCustomModel(!isCustomModel)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isCustomModel ? '← Elegir de la lista' : '✍️ Escribir modelo personalizado'}
            </button>
          </div>

          {isCustomModel ? (
            <input
              type="text"
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              placeholder="Ej: gemini-2.5-pro, gpt-4o, claude-3-7-sonnet..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
          ) : (
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem' }}
            >
              {models[provider]?.map(m => (
                <option key={m} value={m}>{m} {m.includes('flash') || m.includes('mini') || m.includes('haiku') ? '⚡ (Rápido)' : '🧠 (Alta Precisión)'}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
            API Key de {provider === 'gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : 'Anthropic'}
          </label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            placeholder="Pega aquí tu API Key privada"
          />
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
