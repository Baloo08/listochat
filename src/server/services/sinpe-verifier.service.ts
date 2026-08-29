import { env } from '../config/env.js';

const DEFAULT_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || 'AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ';

export interface SinpeReceiptAnalysis {
  isReceipt: boolean;
  amount: number | null;
  reference: string | null;
  destinationPhone: string | null;
  destinationName: string | null;
  date: string | null;
  bank: string | null;
  confidence: number;
  rawText?: string;
  error?: string;
}

/**
 * Analyzes a bank receipt / SINPE Móvil screenshot using Gemini 2.5 Flash Vision.
 */
export async function analyzeSinpeReceipt(
  base64Image: string,
  mimetype: string = 'image/jpeg',
  apiKey?: string
): Promise<SinpeReceiptAnalysis> {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z0-9]+;base64,/, '').trim();
    if (!cleanBase64) {
      return {
        isReceipt: false,
        amount: null,
        reference: null,
        destinationPhone: null,
        destinationName: null,
        date: null,
        bank: null,
        confidence: 0,
        error: 'Imagen base64 vacía'
      };
    }

    const key = apiKey || DEFAULT_GEMINI_KEY;
    const cleanMime = (mimetype || 'image/jpeg').split(';')[0].trim();

    const prompt = `Eres un auditor financiero especializado en validar comprobantes de transferencias bancarias y SINPE Móvil en Costa Rica y Centroamérica (BAC Credomatic, Banco Nacional BNCR, Banco de Costa Rica BCR, Promerica, Scotiabank, Lafise, Davivienda, Coopeande, etc.).

Analiza la imagen adjunta con atención y responde ÚNICAMENTE con un objeto JSON estricto con esta estructura:
{
  "isReceipt": boolean,
  "amount": number o null,
  "reference": string o null,
  "destinationPhone": string o null,
  "destinationName": string o null,
  "date": string o null,
  "bank": string o null,
  "confidence": number
}

Reglas estrictas:
1. "isReceipt": true SOLO si la imagen es claramente una captura de pantalla, comprobante o notificación de transferencia bancaria / SINPE Móvil exitosa. Si es una foto de producto, selfie, meme o paisaje, pon false.
2. "amount": Extrae el monto numérico transferido en colones costarricenses (CRC) o dólares (ej: si dice ₡5.000,00 o 5,000 colones, pon 5000). Si no está claro, pon null.
3. "reference": Extrae el número de comprobante, referencia bancaria, autorización o número de transacción.
4. "destinationPhone": Extrae el número de teléfono receptor de SINPE si está visible (ej: "88889999").
5. "confidence": Número entre 0.0 y 1.0 indicando tu nivel de seguridad en la lectura.
6. Responde SOLAMENTE el JSON válido, sin bloques markdown adicionales.`;

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
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (jsonText) {
            try {
              const parsed = JSON.parse(jsonText);
              console.log('[SinpeVerifier] Successfully parsed receipt:', parsed);
              return {
                isReceipt: Boolean(parsed.isReceipt),
                amount: parsed.amount ? Number(parsed.amount) : null,
                reference: parsed.reference ? String(parsed.reference) : null,
                destinationPhone: parsed.destinationPhone ? String(parsed.destinationPhone) : null,
                destinationName: parsed.destinationName ? String(parsed.destinationName) : null,
                date: parsed.date ? String(parsed.date) : null,
                bank: parsed.bank ? String(parsed.bank) : null,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
                rawText: jsonText
              };
            } catch (pErr) {
              console.warn('[SinpeVerifier] Error parsing Gemini JSON response:', jsonText);
            }
          }
        } else {
          const errText = await response.text();
          console.warn(`[SinpeVerifier] Model ${modelName} returned status ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`[SinpeVerifier] Error with model ${modelName}:`, err.message);
      }
    }

    return {
      isReceipt: false,
      amount: null,
      reference: null,
      destinationPhone: null,
      destinationName: null,
      date: null,
      bank: null,
      confidence: 0,
      error: 'No se pudo procesar la imagen con los modelos disponibles'
    };
  } catch (error: any) {
    console.error('[SinpeVerifier] Fatal error verifying SINPE:', error);
    return {
      isReceipt: false,
      amount: null,
      reference: null,
      destinationPhone: null,
      destinationName: null,
      date: null,
      bank: null,
      confidence: 0,
      error: error.message || 'Error desconocido'
    };
  }
}
