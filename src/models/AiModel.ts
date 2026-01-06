import { v4 as uuidv4 } from 'uuid';
import { normalizeOfferForLLM, OriginalOfferData, sendToLLM } from "../utils/common.js";
import { ChatIntent, ChatRole, LLMProvider, PbCollections } from '../enums/enums.js';
import PocketBase from 'pocketbase';
import { Suggestion } from '../types.js';


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
  message: string;
  params: {
    chat_id?: string;
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
  reported_messages: number[] | null;
  created: string;
  updated: string;
}


export class AIModel {

  public static async initChat(payload: ChatProperties, ip: string | null): Promise<ChatDbRecord> {
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    const record = await pb.collection(PbCollections.CHATS).create({
      chat_id: uuidv4(),
      ip: ip,
      messages: [],
      country_id: payload.params.country,
      provider_id: payload.params.provider,
      client_id: payload.params.client_id,
      reported_messages: []
    });

    return record as ChatDbRecord;
  }

  public static async updateReportedMessages(chatId: string, userReport: { answer_index: number, message: string }): Promise<ChatDbRecord | null> {
    console.log('updateReportedMessages', chatId, userReport);
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    try {
      const chat = await pb.collection(PbCollections.CHATS).getFirstListItem<ChatDbRecord>(`chat_id="${chatId}"`);
      let updatedChat: ChatDbRecord;
      if (chat.reported_messages === null) {
        updatedChat = await pb.collection(PbCollections.CHATS).update(chat.id, { reported_messages: [{ ...userReport, created_at: new Date().toISOString() }] });
      } else {
        updatedChat = await pb.collection(PbCollections.CHATS).update(chat.id, { reported_messages: [...chat.reported_messages, { ...userReport, created_at: new Date().toISOString() }] });
      }
      return updatedChat;
    } catch (error) {
      console.log('Error updating reported messages:', error);
      return null
    }
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

  public static async getAllChatsByClientId(client_id: string): Promise<ChatDbRecord[]> {
    const pb = new PocketBase('https://pb.cashium.pro/');
    pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);
    const allChats = await pb.collection(PbCollections.CHATS).getFullList<ChatDbRecord>({
      filter: `client_id="${client_id}"`
    });
    return allChats;
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

  public static async getSuggestions(lang: string): Promise<Suggestion[]> {
    const options = [
      {
        langs: ['es-es', 'es-mx', 'es'],
        title: 'Prestamos',
        text: 'Encuectre el mejor préstamo',
        prompt:
          'Necesito un préstamo urgente, ayúdame a encontrar la mejor opción, basando en todo lo que conoces',
        id: 0,
        category: 'loan',
      },
      {
        langs: ['se'],
        title: 'Lån',
        text: 'Hitta det bästa lånet',
        prompt:
          'Jag behöver ett lån, hjälp mig att hitta det bästa lånet, baserat på allt jag vet',
        id: 6,
        category: 'loan',
      },
      {
        langs: ['ro'],
        title: 'Împrumuturi',
        text: 'Găsiți cel mai bun împrumut',
        prompt:
          'Am nevoie de un împrumut, ajută-mă să găsesc cel mai bun împrumut, bazat pe tot ce știu',
        id: 7,
        category: 'loan',
      },
      {
        langs: ['ro'],
        title: 'Carduri de credit',
        text: 'Vă voi ajuta să găsiți carduri de credit',
        prompt:
          'Am nevoie de un card de credit personalizat, ajută-mă să găsesc cea mai bună opțiune, bazat pe tot ce știi',
        id: 8,
        category: 'credit_card',
      },
      {
        langs: ['se'],
        title: 'Kreditkort',
        text: 'Jag hjälper dig med att hitta kreditkort',
        prompt:
          'Jag behöver ett anpassat kreditkort, hjälp mig att hitta det bästa alternativet, baserat på allt du vet',
        id: 9,
        category: 'credit_card',
      },
      {
        langs: ['pl'],
        title: 'Kredyty',
        text: 'Znajdziesz najlepszy kredyt',
        prompt:
          'Potrzebuje kredytu, pomoc mi znalezc najlepszy kredyt, na podstawie wszystkiego co wiem',
        id: 1,
        category: 'loan',
      },
      {
        langs: ['en'],
        title: 'Loans',
        text: 'Find the best loan',
        prompt:
          'I need a loan, help me find the best loan, based on everything I know',
        id: 2,
        category: 'loan',
      },
      {
        langs: ['es-es', 'es-mx', 'es'],
        title: 'Tarjetas de crédito',
        text: 'le ayudaré con la busqueda de tarjetas de crédito',
        prompt:
          'Necesito una tarjeta de crédito personalizada, ayúdame a encontrar la mejor opció, basando en todo lo que conoces',
        id: 3,
        category: 'credit_card',
      },
      {
        langs: ['pl'],
        title: 'Karty kredytowe',
        text: 'Karty kredytowe personalizowane',
        prompt:
          'Potrzebuje karty kredytowe personalizowane, pomoc mi znalezc najlepsze karty kredytowe, na podstawie wszystkiego co wiem',
        id: 4,
        category: 'credit_card',
      },
      {
        langs: ['en'],
        title: 'Credit cards',
        text: 'I need a custom credit card, help me find the best credit card, based on everything I know',
        prompt:
          'I need a custom credit card, help me find the best credit card, based on everything I know',
        id: 5,
        category: 'credit_card',
      },
    ];
    const result = [];
    const filtered = options.filter(option => option.langs.includes(lang));
    const seen = new Set();
    for (const option of filtered) {
      if (!seen.has(option.category)) {
        seen.add(option.category);
        result.push(option);
      }
    }
    return result;
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

  public static async summarizeChat(payload: ChatDbRecord, lang: string = "es-mx", format: "html" | "markdown" = "html"): Promise<{ can_decide: boolean, user_intent_summary: string, motivation: string } | null> {
    try {
      const userMessages = payload.messages.filter(el => el.role === "user").map(el => `---user message start---\n${el.data[0].content}\n---user message end---`).join('\n\n')

      const chatSummary = await sendToLLM([
        {
          role: ChatRole.System,
          content: `
          <user infromation rules>
            Absolutely obligatory user information for loans:
            - loan period,
            - loan amount
            optional helpful user information for loans:
            - loan reason
            - user's monthly income
            - user's employment status
            - any existing debts or financial obligations
            Absolutely obligatory user information for credit cards:
            - user's monthly income
            - needs
            optional helpful user information for credit cards:
            - user's employment status
            - any existing debts or financial obligations
            - any existing credit cards
            Never invent any information about the user.
          </user infromation rules>
          <base instruction>
            You're a multilingual text summarizer that strictly follows the provided rules and carefully reads <user information rules>. 

            Summarize the user's messages into a concise structured response in a JSON format with three fields: can_decide (boolean), user_intent_summary (string), and assistant_motivation (string).

            - can_decide must be true only if the bare minimum required user information (loan period and loan amount for loans or user's monthly income for credit cards) is provided, making it sufficient to decide on relevant financial offers. Otherwise, set it to false.
            - user_intent_summary must be a concise but informative summary of the user's intent, needs, and any provided details (including both required and optional information).
            - motivation must be a concise but informative explanation of why the assistant can or cannot proceed to make a decision about relevant financial offers. If information is missing, politely suggest asking for the specific missing required details. For optional information, only mention it briefly if it could help, without insisting or requiring it. Format assistant_motivation as Markdown for better readability (e.g., use bullet points for suggestions).

            motivation must be in the user's language: ${lang}. Motivations must be provided as bare ${format === "html" ? "unstyled" : ""} ${format} output.

            Reply strictly with the structured JSON object and nothing else.
          </base instruction>

          <user messages>
            ${userMessages}
          </user messages>
        `
        }
      ], {
        model: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
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
                "motivation": {
                  "type": "string"
                }
              },
              required: ['can_decide', 'user_intent_summary', "motivation"],
              additionalProperties: false
            }
          }
        }
      }, LLMProvider.DEEPINFRA);
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
    const normalizedOffers = offers.filter(el => el.is_partner === true).filter((el: { offer_type: { type: string; } }) => el.offer_type.type === type).map((el: OriginalOfferData) => {
      return {
        id: el.id,
        text: normalizeOfferForLLM(el)
      }
    })

    const offerAnalysisPromises = normalizedOffers.map(async (offer: { text: string; id: number; }) => {
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
      .filter((result): result is PromiseFulfilledResult<{ id: number; score: number; reason: string; success: boolean; }> =>
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value)
      .filter(offer => offer.score > 6)
      .sort((a, b) => b.score - a.score);

    const resultOfferList = relevantOffers.map(offer => offer.id)
    const idToRpc = new Map<number, number>();
    offers.forEach(offer => {
      idToRpc.set(offer.id, offer.rpc);
    });
    return [...resultOfferList].sort((a, b) => {
      const rpcA = idToRpc.get(a) ?? 0;
      const rpcB = idToRpc.get(b) ?? 0;
      return rpcB - rpcA;
    });

    // return relevantOffers.map(offer => offer.id) as any[];

  }


  public static async getRelevantOffers(offers: OriginalOfferData[], payload: ChatDbRecord, intent: ChatIntent | string, lang: string): Promise<{ motivation: string | null, offer_id_list: Array<string> }> {
    try {

      const normalizedOffers = offers.map((el: OriginalOfferData) => normalizeOfferForLLM(el))
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
        ${normalizedOffers.join('\n\n')}
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