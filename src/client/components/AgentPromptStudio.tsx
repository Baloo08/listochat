import React, { useState, useEffect } from 'react';
import { Bot, Save, Play } from 'lucide-react';

export default function AgentPromptStudio() {
  const [config, setConfig] = useState({
    systemPrompt: '',
    businessName: '',
    currency: 'CRC',
    notifyNumber: ''
  });
  const [simInput, setSimInput] = useState('');
  const [simOutput, setSimOutput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchPrompt = async () => {
    try {
      const res = await fetch('/api/agent/prompt', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if(data) {
          setConfig({
            systemPrompt: data.systemPrompt || '',
            businessName: data.businessName || '',
            currency: data.currency || 'CRC',
            notifyNumber: data.notifyNumber || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configuración guardada exitosamente.');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const handleSimulate = async () => {
    if(!simInput.trim()) return;
    setSimOutput('Simulando respuesta...');
    try {
      const res = await fetch('/api/agent/simulate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: simInput })
      });
      if (res.ok) {
        const data = await res.json();
        setSimOutput(data.reply);
      } else {
        setSimOutput('Error en la simulación.');
      }
    } catch (error) {
      setSimOutput('Error en la simulación.');
    }
  };

  const applyPreset = (preset: string) => {
    let text = '';
    switch(preset) {
      case 'auto':
        text = 'Eres un asistente virtual para un centro de detallado automotriz. Tu objetivo es ayudar a los clientes a conocer nuestros servicios (lavado, pulido, encerado) y agendar citas.';
        break;
      case 'medical':
        text = 'Eres un recepcionista virtual para una clínica. Debes ser empático y profesional. Ayuda a los pacientes a agendar citas médicas con nuestros especialistas.';
        break;
      case 'restaurant':
        text = 'Eres un mesero virtual para un restaurante. Muestra nuestro menú, toma órdenes para llevar o a domicilio y realiza reservas de mesas.';
        break;
      case 'store':
        text = 'Eres un vendedor experto para una tienda de ropa. Ayuda a los clientes a encontrar la talla adecuada, muestra el catálogo y procesa ventas.';
        break;
    }
    if (text) setConfig({ ...config, systemPrompt: text });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', alignItems: 'start' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Bot size={24} /> Estudio del Agente IA</h2>
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            <Save size={18} /> Guardar Cambios
          </button>
        </div>

        {loading ? <div>Cargando...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre del Negocio</label>
                <input type="text" value={config.businessName} onChange={e => setConfig({...config, businessName: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Moneda</label>
                <input type="text" value={config.currency} onChange={e => setConfig({...config, currency: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Número para Notificaciones (Admin)</label>
              <input type="text" value={config.notifyNumber} onChange={e => setConfig({...config, notifyNumber: e.target.value})} placeholder="+50612345678" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Prompt del Sistema</label>
                <select onChange={e => applyPreset(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <option value="">Cargar Plantilla...</option>
                  <option value="auto">Detallado Automotriz</option>
                  <option value="medical">Clínica Médica/Dental</option>
                  <option value="restaurant">Restaurante/Café</option>
                  <option value="store">Tienda de Ropa/E-commerce</option>
                </select>
              </div>
              <textarea 
                value={config.systemPrompt} 
                onChange={e => setConfig({...config, systemPrompt: e.target.value})}
                rows={12}
                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Escribe las instrucciones detalladas de cómo debe comportarse el asistente AI..."
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', position: 'sticky', top: '20px' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Simulador Sandbox</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Prueba cómo responderá el agente a los clientes antes de activarlo.</p>
        
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Mensaje del Cliente:</label>
          <textarea 
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
            placeholder="Hola, ¿tienen disponibilidad para mañana?"
          />
          <button onClick={handleSimulate} style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '8px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            <Play size={16} /> Probar Mensaje
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Respuesta de la IA:</label>
          <div style={{ padding: '15px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
            {simOutput || <span style={{ color: 'var(--text-muted)' }}>La respuesta aparecerá aquí...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
