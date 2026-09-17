import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Bot, Save, Key, Sliders, CheckCircle2, Sparkles, Zap, ShieldCheck, RefreshCw, AlertTriangle, Mic, Volume2 } from 'lucide-react';

export default function TenantSettings() {
  const [mode, setMode] = useState<'betico_ai' | 'byok'>('betico_ai');
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Voice Settings State (Kokoro TTS)
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
  const [voiceId, setVoiceId] = useState('ef_dora');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // Quota & Status State
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  const api = useApi();

  const models: Record<string, string[]> = {
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
    anthropic: ['claude-3-7-sonnet', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
  };

  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');

  const fetchQuotaAndConfig = async () => {
    setLoadingQuota(true);
    try {
      const [quotaData, agentData] = await Promise.all([
        api.get('/api/agent/ai-quota'),
        api.get('/api/agent/prompt')
      ]);

      if (quotaData && quotaData.success) {
        setQuotaInfo(quotaData);
        if (quotaData.isUsingOwnKey) {
          setMode('byok');
          if (quotaData.provider) setProvider(quotaData.provider);
        } else {
          setMode('betico_ai');
        }
      }

      if (agentData) {
        if (agentData.model) {
          setModel(agentData.model);
          const known = Object.values(models).flat();
          if (!known.includes(agentData.model)) {
            setIsCustomModel(true);
            setCustomModelName(agentData.model);
          }
        }
        if (agentData.temperature !== undefined) setTemperature(agentData.temperature);
        if (agentData.voiceRepliesEnabled !== undefined) setVoiceRepliesEnabled(Boolean(agentData.voiceRepliesEnabled));
        if (agentData.voiceId) setVoiceId(agentData.voiceId);
        if (agentData.voiceSpeed !== undefined) setVoiceSpeed(Number(agentData.voiceSpeed) || 1.0);
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    fetchQuotaAndConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (mode === 'betico_ai') {
        // Clear custom key and use platform Betico AI
        await api.post('/api/agent/prompt', {
          provider: 'betico_ai',
          apiKey: '',
          model: 'betico-ai',
          temperature,
          voiceRepliesEnabled,
          voiceId,
          voiceSpeed
        });
      } else {
        const finalModel = isCustomModel ? (customModelName.trim() || model) : model;
        await api.post('/api/agent/prompt', {
          model: finalModel,
          temperature,
          provider,
          ...(apiKey ? { apiKey } : { isKeepingExistingKey: true }),
          voiceRepliesEnabled,
          voiceId,
          voiceSpeed
        });
      }
      setSavedSuccess(true);
      await fetchQuotaAndConfig();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error guardando configuración: ' + (err.message || 'Verifique los datos'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Bot size={24} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Motor de Inteligencia Artificial (Betico AI)</h2>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Configura el motor neuronal que atiende a tus clientes por WhatsApp, genera respuestas de texto y notas de voz naturales.
        </p>
      </div>

      {/* QUOTA STATUS CARD */}
      {quotaInfo && (
        <div style={{
          backgroundColor: quotaInfo.isUsingOwnKey ? '#f0fdf4' : '#eff6ff',
          border: quotaInfo.isUsingOwnKey ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {quotaInfo.isUsingOwnKey ? <ShieldCheck size={20} color="#16a34a" /> : <Zap size={20} color="#2563eb" />}
              <strong style={{ fontSize: '0.95rem', color: quotaInfo.isUsingOwnKey ? '#166534' : '#1e40af' }}>
                {quotaInfo.isUsingOwnKey ? 'Modo Llave Privada Personalizada (BYOK)' : '⚡ Betico AI (Incluida en tu Plan)'}
              </strong>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
              backgroundColor: quotaInfo.isExceeded ? '#fee2e2' : quotaInfo.isUsingOwnKey ? '#dcfce7' : '#dbeafe',
              color: quotaInfo.isExceeded ? '#991b1b' : quotaInfo.isUsingOwnKey ? '#15803d' : '#1e40af'
            }}>
              {quotaInfo.isExceeded ? '🔴 Cuota Agotada' : '🟢 Activo y Operativo'}
            </span>
          </div>

          {!quotaInfo.isUsingOwnKey ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a8a' }}>
                  {quotaInfo.requestsCount || 0}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af' }}>
                  consultas, pedidos y asistencias atendidas este mes
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500' }}>
                ⏱️ ¡Betico AI te ha ahorrado aproximadamente <strong>{Math.max(0, Math.round(((quotaInfo.requestsCount || 0) * 4) / 60 * 10) / 10)} horas</strong> de atención manual a clientes!
              </p>
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #dbeafe', paddingTop: '8px' }}>
                <span>Plan: <strong style={{ textTransform: 'uppercase', color: '#1e40af' }}>{quotaInfo.plan}</strong></span>
                <span>•</span>
                <span>Atención automática 24/7 en WhatsApp <strong>Activa</strong></span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
              Estás utilizando tu propia clave de API ({quotaInfo.provider?.toUpperCase()}). Las consultas no consumen el saldo de tu plan y se facturan directamente en tu cuenta proveedora.
            </p>
          )}
        </div>
      )}

      {/* MODE SELECTOR */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}>
          Selecciona cómo deseas conectar la Inteligencia Artificial:
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          
          {/* Betico AI Card */}
          <div
            onClick={() => setMode('betico_ai')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: mode === 'betico_ai' ? '2px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: mode === 'betico_ai' ? '#eff6ff' : 'var(--background)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Zap size={18} color="var(--primary)" />
              <strong style={{ fontSize: '0.95rem' }}>⚡ Betico AI (Recomendado)</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Motor de IA local soberano incluido directamente en tu suscripción. Cero configuraciones técnicas ni pagos a terceros.
            </p>
          </div>

          {/* BYOK Card */}
          <div
            onClick={() => setMode('byok')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: mode === 'byok' ? '2px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: mode === 'byok' ? '#eff6ff' : 'var(--background)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Key size={18} color="#7c3aed" />
              <strong style={{ fontSize: '0.95rem' }}>🔑 Mi propia API Key (BYOK)</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Conecta tu propia cuenta de DeepSeek, Google Gemini, OpenAI o Anthropic.
            </p>
          </div>

        </div>

        {/* IF BYOK IS SELECTED: SHOW CONFIGURATION FORM */}
        {mode === 'byok' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            
            {/* Guide to get API keys */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={15} color="var(--primary)" /> ¿Dónde conseguir tu API Key?
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" style={{ padding: '5px 10px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700' }}>
                  🔵 DeepSeek Platform ↗
                </a>
                <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ padding: '5px 10px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700' }}>
                  🟢 Google AI Studio (Gemini) ↗
                </a>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ padding: '5px 10px', backgroundColor: '#f3e8ff', color: '#7e22ce', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700' }}>
                  🟣 OpenAI Platform (ChatGPT) ↗
                </a>
                <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ padding: '5px 10px', backgroundColor: '#ffedd5', color: '#c2410c', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700' }}>
                  🟠 Anthropic Console (Claude) ↗
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>Proveedor de IA</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setModel(models[e.target.value]?.[0] || 'deepseek-chat');
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  <option value="deepseek">DeepSeek AI (Económico y potente)</option>
                  <option value="gemini">Google Gemini (Recomendado)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>Modelo</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  {(models[provider] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>Tu Llave de API Secreta (API Key) *</label>
              <input
                type="password"
                placeholder={quotaInfo?.isUsingOwnKey ? '•••••••• (Clave ya guardada)' : 'Pega aquí tu clave (sk-... o AIza...)'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

          </div>
        )}

      </div>

      {/* VOICE NOTES (KOKORO TTS) CARD */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mic size={22} color="var(--primary)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Respuestas por Nota de Voz (Audio WhatsApp)</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Envía notas de voz humanas con onda verde (PTT) generadas con Kokoro TTS.
              </p>
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={voiceRepliesEnabled}
              onChange={(e) => setVoiceRepliesEnabled(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: voiceRepliesEnabled ? 'var(--primary)' : '#cbd5e1',
              borderRadius: '24px', transition: '0.3s'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '18px', width: '18px',
                left: voiceRepliesEnabled ? '26px' : '4px', bottom: '3px',
                backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
              }} />
            </span>
          </label>
        </div>

        {voiceRepliesEnabled ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', color: '#166534' }}>
              🔒 <strong>Consentimiento Inteligente:</strong> Betico AI solo enviará notas de voz si el cliente envía un audio o confirma en el chat que prefiere audios. Si el cliente solicita texto, la IA siempre le responderá por escrito.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Voz de tu Asistente:
                </label>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  <option value="ef_dora">👩 Dora (Español Latino - Femenina Profesional)</option>
                  <option value="em_alex">👨 Alex (Español Latino - Masculino Profesional)</option>
                  <option value="em_santa">🧔 Santa (Español Latino - Masculino Cálido y Cercano)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Velocidad de Locución: {voiceSpeed.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Pausada (0.8x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Dinámica (1.2x)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Las notas de voz están desactivadas. Betico AI responderá exclusivamente mediante mensajes de texto.
          </p>
        )}
      </div>

      {/* SAVE BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface)', padding: '16px 22px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {savedSuccess ? (
          <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={16} /> ¡Configuración actualizada y aplicada con éxito!
          </span>
        ) : (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Los cambios se aplican de forma inmediata en la atención automática de WhatsApp.
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} /> {loading ? 'Guardando...' : 'Guardar y Aplicar'}
        </button>
      </div>

    </div>
  );
}
