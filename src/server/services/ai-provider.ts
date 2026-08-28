import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export interface TenantAIConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature: number;
}

const DEFAULT_GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ';

export function getDefaultModels(provider: 'gemini' | 'openai' | 'anthropic'): string[] {
  switch (provider) {
    case 'gemini':
      return [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-3.7-flash'
      ];
    case 'openai':
      return ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    case 'anthropic':
      return ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
    default:
      return [];
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
