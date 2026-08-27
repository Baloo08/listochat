import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function TenantSettings() {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Configuración guardada exitosamente');
    }, 1000);
  };

  const models: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet']
  };

  return (
    <div style={{ maxWidth: '600px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Configuración de Inteligencia Artificial</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Proveedor de IA</label>
          <select 
            value={provider} 
            onChange={(e) => {
              setProvider(e.target.value);
              setModel(models[e.target.value][0]);
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
            placeholder="sk-..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Modelo</label>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            {models[provider].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Temperatura: {temperature}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valores más altos hacen respuestas más creativas.</span>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleSave}
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        <button 
          style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: '500' }}
        >
          Probar Agente
        </button>
      </div>
    </div>
  );
}
