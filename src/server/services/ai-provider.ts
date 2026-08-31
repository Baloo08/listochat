import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

import { query } from '../db/pool';
import { decrypt } from './encryption';

export interface TenantAIConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature: number;
}

const DEFAULT_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

export function getDefaultModels(provider: 'gemini' | 'openai' | 'anthropic'): string[] {
  switch (provider) {
    case 'gemini':
      return [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];
    case 'openai':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'o1',
        'o1-mini',
        'o3-mini'
      ];
    case 'anthropic':
      return [
        'claude-3-7-sonnet',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022'
      ];
    default:
      return [];
  }
}

export async function getMasterAIConfig(): Promise<TenantAIConfig> {
  try {
    const res = await query(`SELECT key, value, value_encrypted FROM platform_settings WHERE key IN ('master_ai_provider', 'master_ai_key', 'master_ai_model')`);
    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      if (row.value_encrypted) {
        settings[row.key] = decrypt(row.value_encrypted);
      } else {
        settings[row.key] = row.value || '';
      }
    }

    const provider = (settings.master_ai_provider as any) || 'gemini';
    const apiKey = settings.master_ai_key || DEFAULT_GEMINI_KEY;
    const model = settings.master_ai_model || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022');

    return {
      provider,
      apiKey,
      model,
      temperature: 0.7
    };
  } catch (e) {
    return {
      provider: 'gemini',
      apiKey: DEFAULT_GEMINI_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0.7
    };
  }
}

export async function callAI(config: TenantAIConfig, prompt: string): Promise<{ text: string, tokensUsed: number }> {
  const provider = config.provider || 'gemini';
  const apiKey = config.apiKey || (provider === 'gemini' ? DEFAULT_GEMINI_KEY : '');
  const chosenModel = config.model || 'gemini-2.5-flash';
  
  const defaultModels = getDefaultModels(provider);
  const fallbackModels = [chosenModel, ...defaultModels.filter(m => m !== chosenModel)];

  let lastError: any = null;

  for (const modelName of fallbackModels) {
    try {
      return await executeProvider({
        provider,
        apiKey,
        model: modelName,
        temperature: config.temperature ?? 0.7
      }, prompt);
    } catch (error) {
      lastError = error;
      console.error(`Error calling AI with model ${modelName}:`, error);
    }
  }

  console.error('All AI fallback models failed. Last error:', lastError);

  return {
    text: 'Hola, gracias por comunicarte con nosotros. En este momento estamos procesando tu solicitud, en breve un asesor te responderá.',
    tokensUsed: 0
  };
}

async function executeProvider(config: TenantAIConfig, prompt: string) {
  let model;
  
  if (config.provider === 'gemini') {
    const key = config.apiKey || DEFAULT_GEMINI_KEY;
    const google = createGoogleGenerativeAI({ apiKey: key });
    model = google(config.model || 'gemini-2.5-flash');
  } else if (config.provider === 'openai') {
    const openai = createOpenAI({ apiKey: config.apiKey });
    model = openai(config.model || 'gpt-4o-mini');
  } else if (config.provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    model = anthropic(config.model || 'claude-3-5-haiku-20241022');
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  const { text, usage } = await generateText({
    model,
    prompt,
    temperature: config.temperature ?? 0.7,
  });

  return {
    text,
    tokensUsed: usage?.totalTokens || 0,
  };
}
