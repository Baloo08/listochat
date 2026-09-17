import { env } from '../config/env.js';

const KOKORO_URL = process.env.KOKORO_URL || 'http://beticoia_kokoro:80';
const KOKORO_API_KEY = process.env.KOKORO_API_KEY || '0wluti7ql4met803knws0rbspo502cxz';

export interface KokoroTTSOptions {
  voice?: 'ef_dora' | 'em_alex' | 'em_santa' | string;
  speed?: number;
  format?: 'mp3' | 'wav';
}

export interface KokoroTTSResult {
  success: boolean;
  base64?: string;
  buffer?: Buffer;
  mimeType?: string;
  error?: string;
}

/**
 * Sanitizes response text for natural-sounding speech:
 * - Strips WhatsApp formatting (*bold*, _italic_, ~strike~, `code`)
 * - Removes internal command tags (<<<COMMAND_...>>>)
 * - Removes excessive emojis and symbols that degrade TTS pronunciation
 * - Normalizes spacing and punctuation pauses
 */
export function sanitizeTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove command tags
  text = text.replace(/<<<[A-Z_]+:\s*\{.*?\}>>>/gs, '');

  // 2. Remove markdown & WhatsApp formatting
  text = text.replace(/\*([^*]+)\*/g, '$1'); // *bold*
  text = text.replace(/_([^_]+)_/g, '$1');   // _italic_
  text = text.replace(/~([^~]+)~/g, '$1');   // ~strike~
  text = text.replace(/`([^`]+)`/g, '$1');   // `code`

  // 3. Remove URLs
  text = text.replace(/https?:\/\/\S+/gi, 'en el enlace que te adjunto');

  // 4. Remove common WhatsApp bullet symbols and excessive emojis
  text = text.replace(/[👉📍📅⏰🚗✨👤📝💳✅❌🔴🟢⚡💬🛍️🛒]/g, ' ');
  // Remove miscellaneous emoji ranges
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 5. Replace phone numbers or currency with natural pronunciation
  text = text.replace(/₡\s*([0-9]+(?:[\.,][0-9]+)?)/g, '$1 colones');
  text = text.replace(/\$\s*([0-9]+(?:[\.,][0-9]+)?)/g, '$1 dólares');

  // 6. Normalize punctuation and whitespace
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([.,;:!?])/g, '$1');

  // If text is too long for a single voice note, trim gracefully at sentence boundary (max ~450 chars)
  if (text.length > 450) {
    const truncated = text.substring(0, 450);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 200) {
      text = truncated.substring(0, lastPeriod + 1);
    } else {
      text = truncated + '...';
    }
  }

  return text;
}

/**
 * Synthesizes text into high-quality human speech using Kokoro-Web.
 */
export async function generateSpeechWithKokoro(
  text: string,
  options: KokoroTTSOptions = {}
): Promise<KokoroTTSResult> {
  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText || cleanText.trim().length === 0) {
    return { success: false, error: 'Texto vacío para sintetizar voz' };
  }

  const voice = options.voice || 'ef_dora';
  const speed = Math.min(1.3, Math.max(0.7, options.speed ?? 1.0));
  const format = options.format || 'mp3';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s max timeout

    const response = await fetch(`${KOKORO_URL}/api/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KOKORO_API_KEY}`
      },
      body: JSON.stringify({
        model: 'model',
        input: cleanText,
        voice,
        response_format: format,
        speed
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[KokoroTTS] Error response from Kokoro (${response.status}):`, errText);
      return { success: false, error: `Kokoro API error ${response.status}: ${errText}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    console.log(`[KokoroTTS] Generated ${buffer.length} bytes of speech for voice "${voice}"`);
    return {
      success: true,
      buffer,
      base64,
      mimeType
    };
  } catch (error: any) {
    console.error('[KokoroTTS] Synthesis request failed:', error.message || error);
    return {
      success: false,
      error: error.message || 'Error al conectar con el servidor Kokoro TTS'
    };
  }
}
