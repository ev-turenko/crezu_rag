import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  response_format?: {
    type: 'json_schema',
    json_schema: {
      name: string,
      strict: true,
      schema: {
        type: 'object',
        properties: {
          [key: string]: any
        },
        required?: string[],
        additionalProperties: boolean
      }
    }
  };
}

export async function sendToLLM(
  messages: ChatMessage[],
  config: LLMConfig = {},
): Promise<string> {
  try {
    // @ts-ignore
    const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.deepinfra.com/v1/openai';
    // @ts-ignore
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apiKey, baseURL });


    const completion = await openai.chat.completions.create({
      model: config.model ?? 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
      messages,
      temperature: config.temperature ?? 1.0,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
      response_format: config.response_format
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content received from LLM');
    }

    return content;
  } catch (error) {
    console.error('Error sending request to LLM:', error);
    throw new Error('Failed to get response from LLM. Please check your API key and network connection.');
  }
}

interface Offer {
  offer_id: string;
  tags?: string[];
  [key: string]: string | string[] | undefined;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function processOffer(offer: Offer): Offer {
  const processedOffer: Offer = { ...offer };

  if (processedOffer.field2_value && typeof processedOffer.field2_value === 'string' && processedOffer.field2_value.includes('{time}')) {
    const randomTime = getRandomNumber(5, 25);
    processedOffer.field2_value = processedOffer.field2_value.replace('{time}', randomTime.toString());
  }

  if (processedOffer.field4_value && typeof processedOffer.field4_value === 'string' && processedOffer.field4_value.includes('{val}')) {
    const randomVal = getRandomNumber(90, 99);
    processedOffer.field4_value = processedOffer.field4_value.replace('{val}', randomVal.toString());
  }

  return processedOffer;
}


export function formatOffer(offer: Offer): string {
  const processedOffer = processOffer(offer);
  let output = `---offer_id ${processedOffer.offer_id} start ---\n`;

  const keys = Object.keys(processedOffer);

  const processed = new Set<string>();

  for (const key of keys) {
    if (processed.has(key)) continue;

    let isPair = false;
    let headerValue: string = '';
    let valueValue: string = '';
    let valueKey: string = '';

    if (key.endsWith('_h')) {
      valueKey = key.replace(/_h$/, '_v');
      if (processedOffer.hasOwnProperty(valueKey)) {
        isPair = true;
        headerValue = (processedOffer[key] as string) || '';
        valueValue = (processedOffer[valueKey] as string) || '-';
      }
    } else if (key.endsWith('_header')) {
      valueKey = key.replace(/_header$/, '_value');
      if (processedOffer.hasOwnProperty(valueKey)) {
        isPair = true;
        headerValue = (processedOffer[key] as string) || '';
        valueValue = (processedOffer[valueKey] as string) || '-';
      }
    } else if (key.endsWith('_title')) {
      valueKey = key.replace(/_title$/, '_body');
      if (processedOffer.hasOwnProperty(valueKey)) {
        isPair = true;
        headerValue = (processedOffer[key] as string) || '';
        valueValue = (processedOffer[valueKey] as string) || '-';
      }
    }

    if (isPair) {
      headerValue = headerValue.trim();
      if (headerValue !== '') {
        valueValue = valueValue.trim() || '-';
        output += `${headerValue}: ${valueValue}\n`;
      }
      processed.add(key);
      processed.add(valueKey);
    } else {
      if (key === 'offer_id' || key === 'tags') continue;

      const value = processedOffer[key];
      if (value != null && !Array.isArray(value) && typeof value !== 'object') {
        let strValue = String(value).trim();
        if (strValue !== '') {
          output += `${key}: ${value}\n`;
        }
      }
      processed.add(key);
    }
  }

  if (processedOffer.tags && Array.isArray(processedOffer.tags) && processedOffer.tags.length > 0) {
    const validTags = processedOffer.tags.filter(tag => tag && tag.trim() !== '');
    if (validTags.length > 0) {
      output += `[${validTags.join(', ')}]\n`;
    }
  }

  output += `---offer_id ${processedOffer.offer_id} end---\n\n`;

  return output;
}