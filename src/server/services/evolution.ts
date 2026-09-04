const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://betico_evolution:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

interface EvolutionResponse {
  success: boolean;
  data?: any;
  error?: any;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function createInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getInstanceStatus(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function connectInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function disconnectInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: getHeaders()
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendMessage(instanceName: string, number: string, text: string): Promise<EvolutionResponse> {
  try {
    const cleanNumber = (number || '').replace(/@.+$/, '').replace(/\D/g, '');
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
        delay: 1000
      })
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function setWebhook(instanceName: string, webhookUrl: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE'
          ]
        }
      })
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function markAsRead(instanceName: string, remoteJid: string, messageId: string): Promise<EvolutionResponse> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        readMessages: [{
          remoteJid,
          id: messageId,
          fromMe: false
        }]
      })
    }, 15000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendMedia(instanceName: string, number: string, mediaUrl: string, caption?: string): Promise<EvolutionResponse> {
  try {
    const cleanNumber = (number || '').replace(/@.+$/, '').replace(/\D/g, '');
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        mediatype: 'image',
        media: mediaUrl,
        caption: caption || '',
        delay: 1200
      })
    }, 20000);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getBase64FromMediaMessage(instanceName: string, messageKey: any, messageData: any): Promise<{ base64?: string; mimetype?: string; error?: any }> {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message: {
          key: messageKey,
          message: messageData
        },
        convertToMp4: false
      })
    }, 30000);
    if (!response.ok) {
      const errText = await response.text();
      return { error: errText };
    }
    const data = await response.json();
    return {
      base64: data.base64 || data.data?.base64,
      mimetype: data.mimetype || data.data?.mimetype
    };
  } catch (error: any) {
    return { error: error.message || error };
  }
}

export async function fetchWhatsAppContacts(instanceName: string): Promise<Array<{ id: string; name?: string; pushName?: string; phone: string }>> {
  try {
    const endpoints = [
      `${EVOLUTION_API_URL}/chat/findContacts/${instanceName}`,
      `${EVOLUTION_API_URL}/contact/find/${instanceName}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({})
        }, 15000);
        if (response.ok) {
          const list = await response.json();
          const items = Array.isArray(list) ? list : (list.data || []);
          if (items.length > 0) {
            return items
              .filter((c: any) => {
                const jid = c.id || c.jid || c.remoteJid || '';
                return !jid.includes('@g.us') && !jid.includes('@broadcast');
              })
              .map((c: any) => {
                const jid = c.id || c.jid || c.remoteJid || '';
                let rawPhone = (c.number || c.phone || '').replace(/\D/g, '');
                
                if (!rawPhone && jid && !jid.includes('@lid')) {
                  rawPhone = jid.replace(/@.+$/, '').replace(/\D/g, '');
                }

                // If Costa Rica standard 8 digits
                let cleanPhone = rawPhone;
                if (cleanPhone.length === 8) {
                  cleanPhone = '506' + cleanPhone;
                }

                const name = c.name || c.pushName || c.verifiedName || (cleanPhone ? `+${cleanPhone}` : 'Contacto WhatsApp');
                return {
                  id: jid || cleanPhone,
                  name,
                  pushName: c.pushName || name,
                  phone: cleanPhone
                };
              })
              .filter((c: any) => c.phone && c.phone.length >= 8 && c.phone.length <= 13);
          }
        }
      } catch (e) {
        // try next
      }
    }
    return [];
  } catch (err) {
    console.error('Error fetching whatsapp contacts:', err);
    return [];
  }
}

