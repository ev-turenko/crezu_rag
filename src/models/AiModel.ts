import { v4 as uuidv4 } from 'uuid';
import { formatOffer, normalizeOfferForLLM, OriginalOfferData, sendToLLM } from "../utils/common.js";
import { ChatIntent, ChatRole, PbCollections } from '../enums/enums.js';
import PocketBase from 'pocketbase';


export interface ChatMessage {
  index: number;
  role: "system" | "user" | "assistant";
  created_at: string;
  data:
  {
    content: string | any,
    type?: string
  }[]

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
  is_terminated_by_system: boolean;
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
    console.log('TOKEN:', process.env.PB_SUPERADMIN_TOKEN);
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

  public static async saveMessageToChat(chatId: string, terminate_chat: boolean = false, message: { role: "system" | "user" | "assistant"; data: { content: string | any, type?: string }[] }): Promise<ChatDbRecord | null> {
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    try {
      const chat = await pb.collection(PbCollections.CHATS).getFirstListItem<ChatDbRecord>(`chat_id="${chatId}"`);
      if (!chat) {
        return null;
      }
      const updatedMessages = chat.messages;
      updatedMessages.push({
        index: updatedMessages.length,
        created_at: new Date().toISOString(),
        role: message.role,
        data: [...message.data]
      });
      const updatedRecord = await pb.collection(PbCollections.CHATS).update(chat.id, { messages: updatedMessages, is_terminated_by_system: terminate_chat });
      return updatedRecord as ChatDbRecord;
    } catch (error) {
      console.log('Error saving message to chat:', error);
      return null;
    }
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

  public static async isMessageSafe(payload: ChatDbRecord): Promise<boolean | null> {
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

  public static async summarizeChat(payload: ChatDbRecord, lang: string = "es-mx"): Promise<{ can_decide: boolean, user_intent_summary: string, assistant_motivation: string } | null> {
    try {
      const userMessages = payload.messages.filter(el => el.role === "user").map(el => `---user message start---\n${el.data[0].content}\n---user message end---`).join('\n\n')

      const chatSummary = await sendToLLM([
        {
          role: ChatRole.Assistant,
          content: `
          <user infromation rules>
            Absolutely obligatory user information:
            - loan period,
            - loan amount
            optional helpful user information:
            - loan reason
            - user's monthly income
            - user's employment status
            - any existing debts or financial obligations
            Never invent any information about the user.
          </user infromation rules>
          <base instruction>
        You're a multilingual text summarizer that strictly follows the provided rules and carefully reads <user information rules>. 
        Summarize the user's messages into a concise structured response in a JSON format with two fields: can_decide (boolean) and user_intent_summary (string) and assistant_motivation (string).
        can_decide must be true if the user's information is enough to make a decision about relevant for user financial offers, otherwise false.
        user_intent_summary must be a concise but informative summary of the user's intent and needs and provided details.
        assistant_motivation must be a concise but informative summary of why the assistant can or cannot make a decision about relevant for user financial offers, ask for missing information if something is missing.
        assistant_motivation must be in user's language: ${lang}.

        Reply with a structured JSON without adding any other information.
        </base instruction>
        <user messages>
        ${userMessages}
        </user messages>
        `
        }
      ], {
        temperature: 0.0,
        maxTokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: "rule_schema",
            strict: true,
            schema: {
              type: 'object',
              properties: {
                "can_decide": {
                  "type": "boolean"
                },
                "user_intent_summary": {
                  "type": "string"
                },
                "assistant_motivation": {
                  "type": "string"
                }
              },
              required: ['can_decide', 'user_intent_summary', "assistant_motivation"],
              additionalProperties: false
            }
          }
        }
      });
      console.log('Chat summary internal:', chatSummary)

      return JSON.parse(chatSummary)
    } catch (_) {
      return null
    }
  }

  public static async getIntent(payload: ChatDbRecord, intents: string[]): Promise<{ intent: string, confidence: number }> {
    try {
      const userMessages = payload.messages.filter(el => el.role === "user").map(el => `---user message start---\n${el.data[0].content}\n---user message end---`).join('\n\n')

      const chatIntent = await sendToLLM([
        {
          role: ChatRole.System,
          content: `
        You're a multilingual intent classifier. Classify the user's message into one of the following intents: ${intents.join(', ')}. Use only those intents that are provided in the list. Reply with a structured JSON without adding any other information.
        ${userMessages}
        `
        }
      ], {
        temperature: 0.0,
        maxTokens: 60,
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

  public static async getRelevantOffersV2(offers: OriginalOfferData[], user_intent_summary: string, type: string): Promise<string[] | number[]> {
    const normalizedOffers = offers.filter((el: { offer_type: { type: string; }; }) => el.offer_type.type === type).map((el: OriginalOfferData) => {
      return {
        id: el.id,
        text: normalizeOfferForLLM(el)
      }
    })

    const offerAnalysisPromises = normalizedOffers.map(async (offer: { text: string; id: string | number; }) => {
      const messages = [
        {
          role: ChatRole.System,
          content: 'You are an expert at matching offers to user intent. Analyze if the offer is relevant to the user\'s intent and respond with a relevance score from 0-10 and a brief explanation.'
        },
        {
          role: ChatRole.User,
          content: `User Intent: ${user_intent_summary}\n\nOffer: ${offer.text}\n\nIs this offer relevant to the user's intent? Provide a JSON response with format: {"score": <0-10>, "reason": "<brief explanation>"}, do not add anything else.`
        }
      ];

      try {
        const response = await sendToLLM(messages, {
          model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
          temperature: 0.0,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: "scoring_schema",
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  "score": {
                    "type": "number"
                  },
                  "reason": {
                    "type": "string"
                  }
                },
                required: ['score', 'reason'],
                additionalProperties: false
              }
            }
          }
        });

        const analysis = JSON.parse(response);
        return {
          id: offer.id,
          score: analysis.score,
          reason: analysis.reason,
          success: true
        };
      } catch (error) {
        console.error(`Failed to analyze offer ${offer.id}:`, error);
        return {
          id: offer.id,
          score: 0,
          reason: 'Analysis failed',
          success: false
        };
      }
    });

    const results = await Promise.allSettled(offerAnalysisPromises);
    const relevantOffers = results
      .filter((result): result is PromiseFulfilledResult<{ id: string | number; score: number; reason: string; success: boolean; }> =>
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value)
      .filter(offer => offer.score > 5)
      .sort((a, b) => b.score - a.score);

    return relevantOffers.map(offer => offer.id) as any[];
  }


  public static async getRelevantOffers(payload: ChatDbRecord, intent: ChatIntent | string): Promise<{ motivation: string | null, offer_id_list: Array<string> }> {
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