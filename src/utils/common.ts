import OpenAI from 'openai';
import axios from 'axios';
import { DeepInfraModels, DeepSeekModels, LLMProvider } from '../enums/enums.js';
import z from 'zod';
import { getAiProvider } from '../models/AiModel.js';
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import PocketBase from 'pocketbase';

export const escapeFilterValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** Remove all HTML tags from a string, returning plain text. */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool' | 'developer';
  content: string;
}

export interface LLMConfig {
  // model?: string;
  model?: DeepSeekModels | DeepInfraModels,
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
  messages: ChatCompletionMessageParam[],
  config: LLMConfig = {},
  provider: LLMProvider = LLMProvider.DEEPINFRA
): Promise<string> {
  try {

    const ai = getAiProvider(provider)


    const completion = await ai.chat.completions.create({
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

const OFFER_PID_BY_COUNTRY: Record<string, string> = {
  mx: '4797',
  es: '6739',
  pl: '6742',
  ro: '6741',
  se: '7878',
};

export function withCountryPid(urlValue: string, countryCode: string): string {
  const pid = OFFER_PID_BY_COUNTRY[countryCode.toLowerCase()];
  if (!pid || !urlValue) {
    return urlValue;
  }

  try {
    const parsedUrl = new URL(urlValue);
    parsedUrl.searchParams.set('pid', pid);
    return parsedUrl.toString();
  } catch {
    return urlValue;
  }
}

// Builds the same "custom" tracking link the app attaches to offers (MX base-URL swap,
// per-country pid, sub2/sub8), but without per-visitor attribution (sub1/sub3-6/afid),
// since callers of this (e.g. the country feed page) have no single visitor to attribute to.
export function buildPublicOfferUrl(urlValue: string, countryCode: string): string {
  if (!urlValue) return urlValue;
  const cc = countryCode.toLowerCase();

  let offerId: string | null = null;
  try {
    offerId = new URL(urlValue).searchParams.get('offer_id');
  } catch {
    // not a valid absolute URL - fall through, subsequent URL() calls will also fail and return urlValue as-is
  }

  const baseUrl = cc === 'mx' ? 'https://crezufin.xyz/X2zSfS6w' : urlValue;
  const withPid = withCountryPid(baseUrl, cc);

  try {
    const u = new URL(withPid);
    u.searchParams.set('sub2', 'FinmatcherAI');
    if (offerId) u.searchParams.set('sub8', offerId);
    return u.toString();
  } catch {
    return withPid;
  }
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

// ---------------------------------------------------------------------------
// CDN feed (cdn.crezu.net) – used for new countries
// ---------------------------------------------------------------------------

export type CDNOfferRaw = {
  offer_id: number;
  name: string;
  product_type?: string;
  link: string;
  image?: string;
  image_circle?: string;
  tags?: string[];
  buttonText?: string;
  field1_header?: string; field1_value?: string;
  field2_header?: string; field2_value?: string;
  field3_header?: string; field3_value?: string;
  field4_header?: string; field4_value?: string;
  field5_header?: string; field5_value?: string;
  field6_header?: string; field6_value?: string;
  nbu1_link?: string;
  nbu2_link?: string;
  nbu1_header?: string;
  nbu2_header?: string;
  [key: string]: unknown;
};

// Countries whose offers come from the CDN feed, not from finmatcher.
export const CDN_FEED_COUNTRIES = new Set(['co', 'de', 'kz', 'lk', 'my', 'pe', 'vn', 'za', 'ph', 'ua']);

// One or more feed URLs per country.
// Ukraine has two language-specific feeds; both are fetched and deduplicated.
const CDN_FEED_URLS: Record<string, string[]> = {
  co: ['https://cdn.crezu.net/offers_data/configs/co_feed.json'],
  de: ['https://cdn.crezu.net/offers_data/configs/de_feed.json'],
  kz: ['https://cdn.crezu.net/offers_data/configs/kz_ru_feed.json'],
  lk: ['https://cdn.crezu.net/offers_data/configs/lk_feed.json'],
  my: ['https://cdn.crezu.net/offers_data/configs/my_feed.json'],
  pe: ['https://cdn.crezu.net/offers_data/configs/pe_feed.json'],
  vn: ['https://cdn.crezu.net/offers_data/configs/vn_feed.json'],
  za: ['https://cdn.crezu.net/offers_data/configs/za_feed.json'],
  ph: ['https://cdn.crezu.net/offers_data/configs/ph_feed.json'],
  ua: [
    'https://cdn.crezu.net/offers_data/configs/ua_ua_feed.json',
    'https://cdn.crezu.net/offers_data/configs/ua_ru_feed.json',
  ],
};

// SL lead_ids per country – leave empty until configured.
const CDN_LEAD_IDS: Record<string, string> = {
  co: '', de: '', lk: '', my: '', pe: '', vn: '', za: '', ph: '', ua: '',
};

function mapCDNProductType(raw: string | undefined): string {
  if (!raw) return 'fast_loan';
  const l = raw.toLowerCase();
  if (l.includes('credit_card') || l.includes('credit card')) return 'credit_card';
  if (l.includes('debit')) return 'debit_card';
  return 'fast_loan';
}

function buildCDNHeaders(o: CDNOfferRaw): Array<{ title: string; value?: string }> {
  const pairs: [string | undefined, string | undefined][] = [
    [o.field1_header, o.field1_value],
    [o.field2_header, o.field2_value],
    [o.field3_header, o.field3_value],
    [o.field4_header, o.field4_value],
    [o.field5_header, o.field5_value],
    [o.field6_header, o.field6_value],
  ];
  return pairs
    .filter(([h, v]) => h?.trim() && v?.trim())
    .map(([h, v]) => ({ title: stripHtml(h!), value: stripHtml(v!) }));
}

function buildCDNParameters(o: CDNOfferRaw): Array<{ offer_parameters: Array<{ tech_id?: string; name: string; verbose_value: string }> }> {
  const pairs: [string | undefined, string | undefined][] = [
    [o.field1_header, o.field1_value],
    [o.field2_header, o.field2_value],
    [o.field3_header, o.field3_value],
    [o.field4_header, o.field4_value],
    [o.field5_header, o.field5_value],
    [o.field6_header, o.field6_value],
  ];
  const params = pairs
    .filter(([h, v]) => h?.trim() && v?.trim())
    .map(([h, v], i) => ({ tech_id: `field${i + 1}`, name: h!, verbose_value: v! }));
  return params.length ? [{ offer_parameters: params }] : [];
}

export function cdnOfferToOriginal(offer: CDNOfferRaw, countryCode: string, clientId = ''): OriginalOfferData {
  // Replace {time} / {val} placeholders inline (same logic as processOffer)
  let field2v = typeof offer.field2_value === 'string' ? offer.field2_value : '';
  let field4v = typeof offer.field4_value === 'string' ? offer.field4_value : '';
  if (field2v.includes('{time}')) field2v = field2v.replace('{time}', String(getRandomNumber(5, 25)));
  if (field4v.includes('{val}'))  field4v = field4v.replace('{val}',  String(getRandomNumber(90, 99)));

  const processed: CDNOfferRaw = { ...offer, field2_value: field2v, field4_value: field4v };
  const url = (offer.link ?? '').replace('{LEAD_ID}', clientId);

  return {
    id: offer.offer_id,
    name: offer.name,
    offer_type: { type: mapCDNProductType(offer.product_type) },
    country: { country_code: countryCode },
    url,
    bank: { name: offer.name, website: '' },
    avatar: offer.image_circle || offer.image || '',
    tags: Array.isArray(offer.tags) ? offer.tags : [],
    headers: buildCDNHeaders(processed),
    offer_parameter_categories: buildCDNParameters(processed),
    rpc: 0,
    button_text: typeof offer.buttonText === 'string' ? offer.buttonText : null,
    ...(typeof offer.nbu1_link === 'string' && offer.nbu1_link ? { nbu1_link: offer.nbu1_link } : {}),
    ...(typeof offer.nbu2_link === 'string' && offer.nbu2_link ? { nbu2_link: offer.nbu2_link } : {}),
    ...(typeof offer.nbu1_header === 'string' && offer.nbu1_header ? { nbu1_header: offer.nbu1_header } : {}),
    ...(typeof offer.nbu2_header === 'string' && offer.nbu2_header ? { nbu2_header: offer.nbu2_header } : {}),
  };
}

export async function fetchOffersFromCDNFeed(countryCode: string, clientId = ''): Promise<OriginalOfferData[]> {
  const cc = countryCode.toLowerCase();
  if (!CDN_FEED_COUNTRIES.has(cc)) return [];

  const feedUrls = CDN_FEED_URLS[cc] ?? [];
  if (feedUrls.length === 0) return [];

  const leadId = CDN_LEAD_IDS[cc] ?? '';

  try {
    // Fetch all feed URLs in parallel and deduplicate by offer_id
    const allRaw = await Promise.all(
      feedUrls.map(async (configURL) => {
        if (leadId) {
          const ordered = await getOrderedOffers({
            slParams: { lead_id: leadId, page: 'offers', direction: 'swap' },
            feedParams: { configURL },
          });
          if (ordered) return ordered as CDNOfferRaw[];
        }
        return await getJSONConfig({ configURL }) as CDNOfferRaw[];
      })
    );

    // Flatten and deduplicate by offer_id (first occurrence wins)
    const seen = new Set<number>();
    const merged: CDNOfferRaw[] = [];
    for (const batch of allRaw) {
      for (const offer of batch) {
        if (!seen.has(offer.offer_id)) {
          seen.add(offer.offer_id);
          merged.push(offer);
        }
      }
    }

    return merged.map(o => cdnOfferToOriginal(o, cc, clientId));
  } catch {
    return [];
  }
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
    .map(result => {
      const offer = result.value;
      return {
        id: offer.id,
        headers: offer.headers,
        name: offer.name,
        url: withCountryPid(offer.url, countryCode),
        avatar: offer.avatar,
        button_text: null
      }
    });

  return resolvedOffers;
}

export const resolveTranslation = <T>(
  id: number | string | undefined,
  list: { id: number | string; lang: string }[],
  translations: Record<string, T>,
  defaultKey: keyof typeof translations = 'en'
): T => {
  const lang = list.find(item => `${item.id}` === `${id}`)?.lang ?? defaultKey;
  return translations[lang as keyof typeof translations] ?? translations[defaultKey];
};


export function modifyLastMessage(options: {
  messages: ChatCompletionMessageParam[],
  text: string,
  position: 'prepend' | 'append',
  role: 'user' | 'assistant'
}
): ChatCompletionMessageParam[] {
  const lastMessageIndex = [...options.messages].reverse().findIndex(msg => msg.role === options.role);

  if (lastMessageIndex === -1) {
    throw new Error('No user message found in the provided messages array.');
  }

  const index = options.messages.length - 1 - lastMessageIndex;
  const newMessages = [...options.messages];

  const originalContent = newMessages[index].content;
  const modifiedContent =
    options.position === 'prepend' ? `${options.text}\n` + originalContent : originalContent + `\n${options.text}`;
  newMessages[index] = {
    ...newMessages[index],
    content: modifiedContent,
  };

  return newMessages;
}


export async function getResponse(
  options: {
    tools?: ChatCompletionTool[],
    messages: ChatCompletionMessageParam[],
    schema: z.ZodSchema,
    aiProvider: LLMProvider,
    model: DeepSeekModels | DeepInfraModels,
    temperature?: number,
    topP?: number,
    jsonSchemaName?: string,
    maxTokens?: number
  }
): Promise<string> {
  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    if (options.aiProvider === LLMProvider.DEEPSEEK) {

      completion = await getAiProvider(options.aiProvider).chat.completions.create({
        model: options.model,
        tools: options.tools,
        top_p: options.topP,
        messages: modifyLastMessage(
          {
            messages: options.messages,
            text: `Respond with respect to this scheme: ${JSON.stringify(z.toJSONSchema(options.schema))}`,
            position: 'append',
            role: 'user'
          }
        ),
        temperature: options.temperature ?? 0,
        response_format: {
          type: 'json_object',
        },
        max_completion_tokens: options.maxTokens || 100,
      });

    } else {
      // if (!options.jsonSchemaName) {
      //   throw new Error('jsonSchemaName is required when using DeepInfra provider');
      // }
      completion = await getAiProvider(options.aiProvider).chat.completions.create({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0,
        max_completion_tokens: options.maxTokens || 100,
        top_p: options.topP,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: options.jsonSchemaName ?? 'json_schema',
            strict: true,
            schema: z.toJSONSchema(options.schema)
          }
        },
      });
    }
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content received from LLM');
    }
    return content;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export const countries = [
  { code: 'mx', id: 2,   lang: 'es-mx' },
  { code: 'es', id: 1,   lang: 'es-es' },
  { code: 'pl', id: 14,  lang: 'pl'    },
  { code: 'ro', id: 12,  lang: 'ro'    },
  { code: 'se', id: 22,  lang: 'se'    },
  // New countries
  { code: 'co', id: 6, lang: 'es-co' },
  { code: 'de', id: 21, lang: 'de'    },
  { code: 'kz', id: 8, lang: 'ru'    },
  { code: 'lk', id: 10, lang: 'si'    },
  { code: 'my', id: 20, lang: 'ms'    },
  { code: 'pe', id: 5, lang: 'es-pe' },
  { code: 'ph', id: 3, lang: 'fil'   },
  { code: 'ua', id: 7, lang: 'uk'    },
  { code: 'vn', id: 9, lang: 'vi'    },
  { code: 'za', id: 17, lang: 'en'    },
]

// Offer types considered "bank cards" – excluded for new countries (except RO).
export const BANK_CARD_OFFER_TYPES = new Set(['credit_card', 'debit_card', 'bank_card']);

// New countries that should not show bank-card offers.
export const COUNTRIES_WITHOUT_BANK_CARDS = new Set([
  'co', 'de', 'kz', 'lk', 'my', 'pe', 'ph', 'ua', 'vn', 'za',
]);

export async function getFilteredOffersForCountry(countryCode: string): Promise<{ offers: OriginalOfferData[]; types: string[] }> {
  const result = await getSortedffersAndCategories(countryCode);
  if (COUNTRIES_WITHOUT_BANK_CARDS.has(countryCode.toLowerCase())) {
    result.offers = result.offers.filter(
      o => !BANK_CARD_OFFER_TYPES.has(o.offer_type?.type?.toLowerCase())
    );
    result.types = [...new Set(result.offers.map(o => o.offer_type?.type))] as string[];
  }
  return result;
}

// ---------------------------------------------------------------------------
// getOrderedOffers – SL-feed ordering + JSON config fetching
// ---------------------------------------------------------------------------

export type SlParams = {
  lead_id?: string;
  custom_endpoint?: string;
  [key: string]: string | undefined;
};

export type FeedParams = {
  configURL: string;
};

export type OrderedOffersItem = {
  offer_id: number;
  [key: string]: unknown;
};

type OrderedOffersInput = {
  slParams: SlParams;
  feedParams: FeedParams;
};

export const getSLConfig = (slParams: SlParams): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    const endpoint = slParams.custom_endpoint || 'https://sl.crezu.com/sl-feed';
    const paramsToExclude = ['custom_endpoint'];
    const queryParams: [string, string | undefined][] = Object.entries(slParams).filter(
      ([key]) => !paramsToExclude.includes(key)
    );
    const queryString = queryParams.join('&').split(',').join('=');
    axios({
      method: 'GET',
      url: `${endpoint}?${queryString}`,
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => resolve(response.data))
      .catch(() => reject());
  });
};

export const getJSONConfig = (feedParams: FeedParams): Promise<OrderedOffersItem[]> => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url: feedParams.configURL,
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => resolve(response.data))
      .catch(e => reject(e));
  });
};

export const sortOffers = (slOrder: number[], offers: OrderedOffersItem[]): OrderedOffersItem[] => {
  const result: OrderedOffersItem[] = [];
  slOrder.forEach(sl => {
    offers.forEach(offer => {
      if (sl === offer.offer_id) {
        result.push(offer);
      }
    });
  });
  return result;
};

export const getOrderedOffers = async ({ slParams, feedParams }: OrderedOffersInput): Promise<OrderedOffersItem[] | null> => {
  if (!slParams.lead_id && !slParams.custom_endpoint) {
    console.error('you should pass slParams.lead_id');
    return null;
  }
  if (!feedParams.configURL) {
    console.error('you should pass feedParams.configURL');
    return null;
  }
  try {
    const slOrder = await getSLConfig(slParams);
    const offers = await getJSONConfig(feedParams);
    return sortOffers(slOrder, offers);
  } catch {
    return null;
  }
};


export const dateGroups = {
  today: 't',
  yesterday: 'y',
  this_week: 'tw',
  last_week: 'lw',
  this_month: 'tm',
  january: 'm1',
  february: 'm2',
  march: 'm3',
  april: 'm4',
  may: 'm5',
  june: 'm6',
  july: 'm7',
  august: 'm8',
  september: 'm9',
  october: 'm10',
  november: 'm11',
  december: 'm12'
}


export async function logRequestMetaInfo(
    pbSuperAdmin: PocketBase,
    clientId: string,
    ip: string,
    userAgent: string,
    endpoint: string = 'unknown',
    returnedConfig: Record<string, unknown> = {}
): Promise<void> {
    try {
        await pbSuperAdmin.collection('requests_meta_info').create({
            client_id: clientId,
            ip,
            user_agent: userAgent,
            endpoint,
            returned_config: returnedConfig
        });
    } catch {
        // non-critical, swallow errors
    }
}