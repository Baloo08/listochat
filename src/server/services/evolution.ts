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

export async function createInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getInstanceStatus(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function connectInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function disconnectInstance(instanceName: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendMessage(instanceName: string, number: string, text: string): Promise<EvolutionResponse> {
  try {
    const cleanNumber = (number || '').replace(/@.+$/, '').replace(/\D/g, '');
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
        delay: 1000
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function setWebhook(instanceName: string, webhookUrl: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
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
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function markAsRead(instanceName: string, remoteJid: string, messageId: string): Promise<EvolutionResponse> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        readMessages: [{
          remoteJid,
          id: messageId,
          fromMe: false
        }]
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
