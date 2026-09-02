import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

import { query } from '../db/pool.js';
import { decrypt } from './encryption.js';
import { env } from '../config/env.js';

export interface TenantAIConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'localai' | 'betico_ai';
  apiKey: string;
  model: string;
  temperature: number;
  baseUrl?: string;
}

const DEFAULT_GEMINI_KEY = env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ';

export function getDefaultModels(provider: string): string[] {
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
    case 'localai':
    case 'betico_ai':
      return [
        'gpt-4',
        'gpt-4o'
      ];
    default:
      return [];
  }
}

export async function getMasterAIConfig(): Promise<TenantAIConfig> {
  try {
    const res = await query("SELECT key, value, value_encrypted FROM platform_settings WHERE key IN ('master_ai_provider', 'master_ai_key', 'master_ai_model', 'localai_url', 'localai_model', 'localai_api_key', 'localai_enabled')");
    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      if (row.value_encrypted) {
        settings[row.key] = decrypt(row.value_encrypted);
      } else {
        settings[row.key] = row.value || '';
      }
    }

    const localaiEnabled = settings.localai_enabled !== 'false';
    const localaiUrl = settings.localai_url || process.env.LOCALAI_URL || 'https://beticoia-localai.qvtdko.easypanel.host/v1';
    let localaiModel = settings.localai_model || 'gpt-4';
    if (!localaiModel || localaiModel.includes('llama') || localaiModel.includes('qwen') || localaiModel.includes('gemini')) {
      localaiModel = 'gpt-4';
    }

    if (localaiEnabled) {
      return {
        provider: 'localai',
        apiKey: settings.localai_api_key || 'localai',
        model: localaiModel,
        temperature: 0.7,
        baseUrl: localaiUrl
      };
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

export interface StructuredPrompt {
  system?: string;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export type AIPromptInput = string | StructuredPrompt;

export async function callAI(config: TenantAIConfig, input: AIPromptInput): Promise<{ text: string, tokensUsed: number }> {
  const provider = config.provider || 'gemini';
  const apiKey = config.apiKey || (provider === 'gemini' ? DEFAULT_GEMINI_KEY : '');
  
  // Sanitize model name for LocalAI so it never calls non-existent files
  let chosenModel = config.model;
  if (provider === 'localai' || provider === 'betico_ai') {
    if (!chosenModel || chosenModel.includes('llama') || chosenModel.includes('qwen') || chosenModel.includes('gemini') || chosenModel.includes('claude')) {
      chosenModel = 'gpt-4';
    }
  } else if (!chosenModel) {
    chosenModel = provider === 'openai' ? 'gpt-4o-mini' : provider === 'anthropic' ? 'claude-3-5-haiku-20241022' : 'gemini-2.5-flash';
  }
  
  const defaultModels = getDefaultModels(provider);
  const fallbackModels = [chosenModel, ...defaultModels.filter(m => m !== chosenModel)];

  let lastError: any = null;

  for (const modelName of fallbackModels) {
    try {
      return await executeProvider({
        provider,
        apiKey,
        model: modelName,
        temperature: config.temperature ?? 0.7,
        baseUrl: config.baseUrl
      }, input);
    } catch (error) {
      lastError = error;
      console.error(`Error calling AI with model ${modelName} (${provider}):`, error);
      if (provider === 'localai' || provider === 'betico_ai') {
        break; // For LocalAI, jump immediately to Gemini failover instead of trying invalid models
      }
    }
  }

  // RESILIENT FAILOVER: If LocalAI failed, fallback to Master Gemini 2.5 Flash
  if (provider === 'localai' || provider === 'betico_ai') {
    console.warn('[AI-Provider] LocalAI unavailable or timed out. Engaging Master Gemini Failover...');
    try {
      let masterKey = DEFAULT_GEMINI_KEY;
      try {
        const masterConf = await getMasterAIConfig();
        if (masterConf.apiKey && masterConf.apiKey !== 'localai') {
          masterKey = masterConf.apiKey;
        }
      } catch (e) {}

      return await executeProvider({
        provider: 'gemini',
        apiKey: masterKey || DEFAULT_GEMINI_KEY,
        model: 'gemini-2.5-flash',
        temperature: 0.7
      }, input);
    } catch (geminiError) {
      console.error('[AI-Provider] Master Gemini Failover also failed:', geminiError);
    }
  }

  console.error('All AI fallback models failed. Last error:', lastError);

  return {
    text: 'Hola, gracias por comunicarte con nosotros. En este momento estamos procesando tu solicitud, en breve un asesor te responderá.',
    tokensUsed: 0
  };
}

async function executeProvider(config: TenantAIConfig, input: AIPromptInput) {
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
  } else if (config.provider === 'localai' || config.provider === 'betico_ai') {
    const localai = createOpenAI({
      baseURL: config.baseUrl || process.env.LOCALAI_URL || 'https://beticoia-localai.qvtdko.easypanel.host/v1',
      apiKey: config.apiKey || 'localai'
    });
    model = localai(config.model || 'gpt-4');
  } else {
    throw new Error("Unsupported provider: " + config.provider);
  }

  // 120s timeout — user prefers slow AI response over generic fallback
  const timeoutPromise = new Promise<{ text: string, tokensUsed: number }>((_, reject) => {
    setTimeout(() => reject(new Error('AI inference timeout after 120s')), 120000);
  });

  const t0 = Date.now();
  const generatePromise = (async () => {
    let callParams: any = {
      model,
      temperature: config.temperature ?? 0.7,
    };

    let promptLengthEstimate = 0;

    if (typeof input === 'string') {
      callParams.prompt = input;
      promptLengthEstimate = input.length;
    } else {
      if (input.system) {
        callParams.system = input.system;
        promptLengthEstimate += input.system.length;
      }
      if (input.messages && input.messages.length > 0) {
        callParams.messages = input.messages;
        promptLengthEstimate += input.messages.reduce((acc, m) => acc + (m.content || '').length, 0);
      } else if (input.system) {
        callParams.prompt = input.system;
      }
    }

    const { text, usage } = await generateText(callParams);
    console.log(`[AI-Provider] ${config.provider}/${config.model} responded in ${Date.now() - t0}ms, tokens: ${usage?.totalTokens || '?'}`);
    return {
      text,
      tokensUsed: usage?.totalTokens || Math.ceil((promptLengthEstimate + text.length) / 4),
    };
  })();

  return await Promise.race([generatePromise, timeoutPromise]);
}
