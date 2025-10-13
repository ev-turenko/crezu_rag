import { v4 as uuidv4 } from 'uuid';
import { formatOffer, sendToLLM } from "../utils/common.js";
import { ChatIntent, ChatRole, PbCollections } from '../enums/enums.js';
import PocketBase from 'pocketbase';


export interface ChatMessage {
  index: number;
  role: "system" | "user" | "assistant";
  created_at: string;
  data: [
    {
      content: string | any
    }
  ]
}

export interface ChatPayload {
  chat_id?: string;
  messages: ChatMessage[]
}

export interface ChatProperties {
  chat_id?: string;
  message: string;
  params: {
    country: number,
    provider: number,
    client_id: string,
  }
}

export interface ChatDbRecord {
  collectionId: string;
  collectionName: string;
  id: string;
  ip: string | null;
  client_id: string;
  country_id: string;
  provider_id: string;
  chat_id: string;
  messages: ChatMessage[];
  created: string;
  updated: string;
}


export class AIModel {
  public static assignIdToChatSession(payload: ChatPayload): ChatPayload {
    const deepCopy = JSON.parse(JSON.stringify(payload));
    if (!deepCopy.chat_id) {
      deepCopy.chat_id = uuidv4();
    }
    return deepCopy;
  }

  public static async initChat(payload: ChatProperties, ip: string | null): Promise<ChatDbRecord> {
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    const record = await pb.collection(PbCollections.CHATS).create({
      chat_id: uuidv4(),
      ip: ip,
      messages: [
        {
          index: 0,
          created_at: new Date().toISOString(),
          role: 'user',
          data: [{
            content: payload.message
          }]
        }
      ],
      country_id: payload.params.country,
      provider_id: payload.params.provider,
      client_id: payload.params.client_id,
    });
    
    return record as ChatDbRecord;
  }

public static async getChatById(chatId: string): Promise<ChatDbRecord | null> {
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    try {
      const record = await pb.collection(PbCollections.CHATS).getFirstListItem<ChatDbRecord>(`chat_id="${chatId}"`);
      return record;
    } catch (error) {
      console.log('Chat not found:', error);
      return null;
    }
  }

  public static async isMessageSafe(payload: ChatPayload): Promise<boolean | null> {
    const lastUserMessage = payload.messages.slice().reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) {
      return null
    }
    try {

      const safetyResponse = await sendToLLM([
        {
          role: ChatRole.System,
          content: "You're a multilingual text safety manager. Check if the user's message is safe or unsafe."
        },
        {
          role: ChatRole.User,
          content: lastUserMessage?.data[0].content
        }
      ], {
        model: 'meta-llama/Llama-Guard-4-12B',
        temperature: 0.0,
        maxTokens: 30,
      });

      return !safetyResponse?.toLowerCase().includes('unsafe')
    } catch (_) {
      return null
    }
  }

  public static async getIntent(payload: ChatPayload): Promise<{ intent: ChatIntent, confidence: number }> {
    try {

      const intentList = [ChatIntent.LOAN_SEARCH, ChatIntent.DEBIT_CARD_SEARCH, ChatIntent.CREDIT_CARD_SEARCH, ChatIntent.URGENT_LOAN_SEARCH, ChatIntent.BANK_CARD_OR_LOAN_SEARCH, ChatIntent.OTHER];
      const userMessages = payload.messages.filter(el => el.role === "user").map(el => `---user message start---\n${el.data[0].content}\n---user message end---`).join('\n\n')

      const chatIntent = await sendToLLM([
        {
          role: ChatRole.System,
          content: `
        You're a multilingual intent classifier. Classify the user's message into one of the following intents: ${intentList.join(', ')}. Use only those intents that are provided in the list. Reply with a structured JSON without adding any other information.
        ${userMessages}
        `
        }
      ], {
        temperature: 0.0,
        maxTokens: 30,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: "intent_schema",
            strict: true,
            schema: {
              type: 'object',
              properties: {
                "intent": {
                  "type": "string"
                },
                "confidence": {
                  "type": "number"
                }
              },
              required: ['intent', 'confidence'],
              additionalProperties: false
            }
          }
        }
      });

      return JSON.parse(chatIntent)
    } catch (error) {
      return { intent: ChatIntent.UNKNOWN, confidence: 1 }
    }
  }

  public static async getRelevantOffers(payload: ChatPayload, intent: ChatIntent | string): Promise<{ motivation: string | null, offer_id_list: Array<string> }> {
    try {
      const reqOffers = await fetch('https://cdn.crezu.net/offers_data/configs/mx_feed.json')
      const resOffers = await reqOffers.json()

      let txtOffers = ""
      for (const offer of resOffers) {
        txtOffers + - formatOffer(offer)
      }

      // const userMessages = payload.messages.filter(el => el.role === "user").map(el => `---user message start---\n${el.data[0].content}\n---user message end---`).join('\n\n')

      const chatResult = await sendToLLM([
        {
          role: ChatRole.System,
          content: `
          <base instruction>
        You're a financial expert in finding the best relevant financial offers. Do your best to answer the user's question using the provided offers. Use only those offers that are provided in the list. Reply with a structured JSON without adding any other information, order_id_list must contain ordered offers by relevance for the user.
        If the user's information is not enough to make a decision, reply with an empty for offer_id_list and kindly request information that may help you request for additional information. Always reply in user's language. Your sole purpose is to assist with finding the best relevant financial offers.
        You must be provided with the following information:
        Absolutely required:
        - Loan period
        – Loan reason
        – Loan amount
        Optional but very useful:
        - User's monthly income
        - User's employment status
        - Any existing debts or financial obligations
        Never invent any information about the user.
        </base instruction>

        <offers>
        ${txtOffers}
        </offers>

        <main user intent>
        ${intent}
        </main user intent>

        Provide maximum 15 offer ids in array
        `
        },
        ...payload.messages.map(el => {
          return {
            role: el.role,
            content: el.data[0].content
          }
        })
      ], {
        temperature: 0.0,
        maxTokens: 3000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: "intent_schema",
            strict: true,
            schema: {
              type: 'object',
              properties: {
                "motivation": {
                  "type": "string"
                },
                "offer_id_list": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              required: ['motivation', 'offer_id_list'],
              additionalProperties: false
            }
          }
        }
      });

      return JSON.parse(chatResult)
    } catch (error) {
      return { motivation: null, offer_id_list: [] }
    }
  }

  public static extractInformation(payload: ChatPayload): Promise<ChatPayload> {

    return Promise.resolve(payload);
  }
}