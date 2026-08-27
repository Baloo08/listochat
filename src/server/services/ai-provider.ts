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

export function getDefaultModels(provider: 'gemini' | 'openai' | 'anthropic'): string[] {
  switch (provider) {
    case 'gemini':
      return [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-2.5-pro',
        'gemini-flash-latest',
        'gemini-1.5-flash'
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
  const defaultModels = getDefaultModels(config.provider);
  // Put the chosen model first, then the rest as fallbacks
  const fallbackModels = [config.model, ...defaultModels.filter(m => m !== config.model)];

  for (const modelName of fallbackModels) {
    try {
      return await executeProvider({ ...config, model: modelName }, prompt);
    } catch (error) {
      console.error(`Error calling AI with model ${modelName}:`, error);
      // fallback to next model in list
    }
  }

  return {
    text: 'Hola, gracias por comunicarte con nosotros. En este momento estamos procesando tu solicitud, en breve un asesor te responderá.',
    tokensUsed: 0
  };
}

async function executeProvider(config: TenantAIConfig, prompt: string) {
  let model;
  
  if (config.provider === 'gemini') {
    const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
    model = google(config.model);
  } else if (config.provider === 'openai') {
    const openai = createOpenAI({ apiKey: config.apiKey });
    model = openai(config.model);
  } else if (config.provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    model = anthropic(config.model);
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  const { text, usage } = await generateText({
    model,
    prompt,
    temperature: config.temperature,
  });

  return {
    text,
    tokensUsed: usage?.totalTokens || 0,
  };
}
