import { env } from '../config/env.js';

const DEFAULT_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ';

export interface TranscriptionResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Transcribes an incoming WhatsApp audio/voice note into text using Gemini 2.5 Flash Multimodal.
 */
export async function transcribeAudioWithGemini(
  base64Audio: string,
  mimetype: string = 'audio/ogg',
  apiKey?: string
): Promise<TranscriptionResult> {
  try {
    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '').trim();
    if (!cleanBase64) {
      return { success: false, text: '', error: 'Audio base64 vacío' };
    }

    const key = apiKey || DEFAULT_GEMINI_KEY;
    const cleanMime = (mimetype || 'audio/ogg').split(';')[0].trim();

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

    for (const modelName of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: cleanBase64
                    }
                  },
                  {
                    text: 'Por favor transcribe con exactitud lo que dice este mensaje de voz o audio en español (Costa Rica / Latinoamérica). Devuelve únicamente el texto exacto sin saludos, explicaciones ni comentarios adicionales.'
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (candidateText) {
            console.log(`[AudioTranscriber] Transcribed audio successfully (${candidateText.length} chars): "${candidateText}"`);
            return { success: true, text: candidateText };
          }
        } else {
          const errText = await response.text();
          console.warn(`[AudioTranscriber] Model ${modelName} returned status ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`[AudioTranscriber] Error trying ${modelName}:`, err.message);
      }
    }

    return { success: false, text: '', error: 'No se pudo transcribir el audio con los modelos disponibles' };
  } catch (error: any) {
    console.error('[AudioTranscriber] Fatal transcription error:', error);
    return { success: false, text: '', error: error.message || 'Error desconocido' };
  }
}

export async function transcribeAudioWithWhisper(
  base64Audio: string,
  mimetype: string = 'audio/ogg'
): Promise<TranscriptionResult> {
  try {
    const LOCALAI_URL = process.env.LOCALAI_URL || 'https://beticoia-localai.qvtdko.easypanel.host/v1';
    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '').trim();
    if (!cleanBase64) return { success: false, text: '', error: 'Audio base64 vacío' };
    
    const audioBuffer = Buffer.from(cleanBase64, 'base64');
    const ext = mimetype.includes('ogg') ? 'ogg' : mimetype.includes('mp3') ? 'mp3' : mimetype.includes('mp4') ? 'mp4' : 'ogg';
    const blob = new Blob([audioBuffer], { type: mimetype });
    
    const formData = new FormData();
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    
    const response = await fetch(`${LOCALAI_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer localai' },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      const text = data.text?.trim() || '';
      if (text) {
        console.log(`[AudioTranscriber] Whisper transcribed: "${text}"`);
        return { success: true, text };
      }
    }
    
    console.warn(`[AudioTranscriber] Whisper failed (${response.status}), falling back to Gemini...`);
    return { success: false, text: '', error: `Whisper returned ${response.status}` };
  } catch (error: any) {
    console.warn('[AudioTranscriber] Whisper error, falling back to Gemini:', error.message);
    return { success: false, text: '', error: error.message };
  }
}

export async function transcribeAudio(
  base64Audio: string,
  mimetype: string = 'audio/ogg',
  apiKey?: string
): Promise<TranscriptionResult> {
  // Try local Whisper first
  const whisperResult = await transcribeAudioWithWhisper(base64Audio, mimetype);
  if (whisperResult.success) return whisperResult;
  
  // Fallback to Gemini
  console.log('[AudioTranscriber] Falling back to Gemini for transcription...');
  return transcribeAudioWithGemini(base64Audio, mimetype, apiKey);
}
