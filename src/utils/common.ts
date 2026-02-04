import OpenAI from 'openai';
import { LLMProvider } from '../enums/enums.js';

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
    type: 'json_schema';
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
  } | {
    type: 'json_object'
  };
}

export async function sendToLLM(
  messages: ChatMessage[],
  config: LLMConfig = {},
  provider: LLMProvider = LLMProvider.DEEPINFRA
): Promise<string> {
  try {

    const llmConfig = {
      deepinfra: {
        baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.deepinfra.com/v1/openai',
        apiKey: process.env.OPENAI_API_KEY || '',
      },
      deepseek: {
        baseURL: process.env.DEEPSEEK_OPENAI_BASE_URL || 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_OPENAI_KEY || '',
      },
    }[provider] || { baseURL: '', apiKey: '' };

    const { baseURL, apiKey } = llmConfig;


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


interface OfferParameter {
  tech_id?: string;
  name: string;
  verbose_value: string;
}

interface OfferParameterCategory {
  offer_parameters: OfferParameter[];
}

interface OfferHeader {
  title: string;
  value?: string;
}

interface OfferType {
  type: string;
}

interface OfferCountry {
  country_code: string;
}

interface OfferBank {
  name: string;
  website: string;
}

export interface OriginalOfferData {
  id: number;
  name: string;
  offer_type: OfferType;
  country: OfferCountry;
  url: string;
  bank: OfferBank;
  avatar?: string;
  tags?: string[];
  offer_parameter_categories: OfferParameterCategory[];
  headers: OfferHeader[];
  [key: string]: any;
}

interface NormalizedOffer {
  id: number;
  name: string;
  offer_type: string;
  country: string;
  url: string;
  bank_name: string;
  website: string;
  avatar?: string;
  tags?: string[];
  parameters: { [key: string]: string };
  headers: { [key: string]: string };
}

export function normalizeOfferForLLM(originalData: OriginalOfferData): string {
  const normalized: NormalizedOffer = {
    id: originalData.id,
    name: originalData.name,
    offer_type: originalData.offer_type.type,
    country: originalData.country.country_code,
    url: originalData.url,
    bank_name: originalData.bank.name,
    website: originalData.bank.website,
    tags: originalData.tags,
    parameters: {},
    headers: {},
  };

  for (const category of originalData.offer_parameter_categories) {
    for (const param of category.offer_parameters) {
      if (param.tech_id && param.verbose_value.trim()) {
        normalized.parameters[param.tech_id] =
          `${param.name}: ${param.verbose_value.trim()}`;
      }
    }
  }

  for (const header of originalData.headers) {
    if (header.value) {
      normalized.headers[header.title] =
        `${header.title}: ${header.value}`;
    }
  }

  return JSON.stringify(normalized, null, 2);
}

export async function getSortedffersAndCategories(countryCode: string = 'mx'): Promise<{ offers: OriginalOfferData[]; types: string[] }> {
  const url = 'https://finmatcher.com/api/offer?size=100000';
  const request = await fetch(url);
  const response = await request.json();
  const offers = response.items.filter((el: { country: { country_code: string; }; }) => el.country.country_code === countryCode);
  offers.sort((a: { rcp: number; }, b: { rcp: number; }) => b.rcp - a.rcp);
  return {
    offers: offers,
    types: [...new Set(offers.map((o: { offer_type: { type: string; }; }) => o.offer_type.type))] as string[]
  };
}

export function getOffersByType(offers: OriginalOfferData[], type: string): OriginalOfferData[] {
  return offers.filter(offer => offer.offer_type.type === type);
}

export async function fetchOffersByIds(offerIds: number[] | string[], countryCode: string): Promise<any[]> {
  const offerPromises = offerIds.map(async (offerId) => {
    const url = new URL('https://finmatcher.com/api/offer');
    url.searchParams.append('id', String(offerId));
    url.searchParams.append('country_code', countryCode);
    
    const response = await fetch(url.toString());
    if (response.status === 200) {
      const data = await response.json();
      return data.items?.[0] || null;
    }
    return null;
  });

  const settledOffers = await Promise.allSettled(offerPromises);
  const resolvedOffers = settledOffers
    .filter((result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);

  return resolvedOffers;
}