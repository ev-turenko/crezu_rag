/* 
TODO:
1) improve the part of the code that checks the user data completeness to find a relevant offer. It should not be as strict as it is now.
2) improve routing and scroing based on JSON, not on LLM sentiment.
*/

// 1e3912eb-7b0c-4875-bbaf-0c9096b0e4e0

import { Request, Response } from 'express';
import { AIModel, ChatDbRecord, ChatProperties } from '../models/AiModel.js';
import { ChatIntent, ChatRole, ContentDataType, DeepInfraModels, LLMProvider } from '../enums/enums.js';
import { getSortedffersAndCategories, fetchOffersByIds, normalizeOfferForLLM, OriginalOfferData, getResponse } from '../utils/common.js';
import { marked } from 'marked';
import z from 'zod';

const INTERNAL_MEMORY_TYPE = 'internal_memory';

function getLatestMemory(chat: ChatDbRecord): { preferences: Record<string, string>, rolling_summary: string, last_request: string } | null {
    const memoryMessage = [...chat.messages].reverse().find(msg =>
        msg.role === ChatRole.System && msg.data?.some(item => item?.type === INTERNAL_MEMORY_TYPE)
    );
    const raw = memoryMessage?.data?.find(item => item?.type === INTERNAL_MEMORY_TYPE)?.content;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
        const parsed = JSON.parse(raw);
        return {
            preferences: parsed?.preferences ?? {},
            rolling_summary: parsed?.rolling_summary ?? '',
            last_request: parsed?.last_request ?? ''
        };
    } catch {
        return null;
    }
}

function buildMemoryContext(summary: { preferences: Record<string, string>, rolling_summary: string, last_request: string } | null): string {
    if (!summary) return '';
    const parts: string[] = [];
    if (summary.last_request) {
        parts.push(`Last request: ${summary.last_request}`);
    }
    const prefEntries = Object.entries(summary.preferences || {});
    if (prefEntries.length > 0) {
        parts.push(`Preferences:\n${prefEntries.map(([key, value]) => `- ${key}: ${value}`).join('\n')}`);
    }
    if (summary.rolling_summary) {
        parts.push(`Rolling summary:\n${summary.rolling_summary}`);
    }
    return parts.join('\n\n');
}

async function extractRequestedOfferIds(options: { latestMessage: string; offers: OriginalOfferData[]; lang: string; }): Promise<number[]> {
    if (!options.latestMessage || options.offers.length === 0) return [];

    const compactOffers = options.offers.slice(0, 200).map(offer => ({
        id: offer.id,
        name: offer.name,
        bank: offer.bank?.name,
        url: offer.url
    }));

    try {

        const messages: any[] = [
            {
                role: ChatRole.System,
                content: `You extract user-requested offer IDs for comparison. The user message is in ${options.lang}. Only select offers explicitly requested or clearly referenced by name/brand/link. If the user did not request specific offers for comparison, return an empty array. Use only the provided offer list. Respond strictly with JSON.`
            },
            {
                role: ChatRole.Dev,
                content: `User message: ${options.latestMessage}\n\nOffer list (max 200): ${JSON.stringify(compactOffers)}`
            }
        ]

        const response = await getResponse({
            messages: messages,
            schema: z.object({
                selected_offer_ids: z.array(z.number()).max(2),
                reason: z.string(),
            }).strict(),
            aiProvider: LLMProvider.DEEPINFRA,
            model: DeepInfraModels.LLAMA4_MAVERICK_17B,
            temperature: 0.0,
            maxTokens: 400,
        })

        console.log('EXTRACTED RESPONSE:', response);

        // Check if response is an error message
        if (typeof response === 'string' && response.startsWith('Error:')) {
            console.log("MESSAGES:", messages)
            console.error('API returned error:', response);
            return [];
        }

        const parsed = JSON.parse(response);
        const ids = Array.isArray(parsed.selected_offer_ids) ? parsed.selected_offer_ids : [];
        return ids.filter((id: number) => compactOffers.some(offer => offer.id === id)).slice(0, 2);
    } catch (error) {
        console.error('Failed to extract requested offer ids:', error);
        return [];
    }
}

async function buildComparisonText(options: { offerA: OriginalOfferData; offerB: OriginalOfferData; lang: string; userIntent: string; memoryContext: string; }): Promise<string> {
    const offerAText = normalizeOfferForLLM(options.offerA);
    const offerBText = normalizeOfferForLLM(options.offerB);

    const response = await getResponse({
        messages: [
            {
                role: ChatRole.System,
                content: `You compare two financial offers. Reply in ${options.lang}. Use a strict, mobile-friendly two-column label format with fixed labels Offer A and Offer B. Each line must follow: "Label: <Offer A> | <Offer B>". No tables, no extra text, no bullets outside the line. Include the following labels in order: Offer A Name, Offer B Name, Fees/Rate, Eligibility, Benefits, Pros, Cons, Summary. For Pros and Cons, use short semicolon-separated phrases. Keep lines concise.`
            },
            {
                role: ChatRole.User,
                content: `User intent: ${options.userIntent}\n\nMemory context:\n${options.memoryContext || 'N/A'}\n\nOffer A:\n${offerAText}\n\nOffer B:\n${offerBText}`
            }
        ],
        schema: z.string(),
        aiProvider: LLMProvider.DEEPINFRA,
        model: DeepInfraModels.LLAMA4_MAVERICK_17B,
        temperature: 0.2,
        maxTokens: 800,
    });

    return response;
}

const irrelevantChatMessageTranslations = {
    'es': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-mx': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-es': "Solo puedo ayudarte con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'pl': "Możę Ci pomóc z wyszukiwaniem kredytu, kartą debetową i kartą kredytową.",
    'en': "I can help you with loan search, debit card and credit card.",
    'ro': "Pot sa va ajut cu cautarea de imprumuturi, carduri de debit si carduri de credit.",
    'se': "Jag kan hjälpa dig med lånesökning, betalkort och kreditkort."
}

const serverErrorTryLaterTranslations = {
    'es': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-mx': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-es': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'pl': "Przepraszamy, wystąpił błąd serwera. Proszę spróbuj ponownie później.",
    'en': "Sorry, there was an error on the server. Please try again later.",
    'ro': "Ne pare rau, a apărut o eroare pe server. Vă rugăm să încercați din nou mai târziu.",
    'se': "Tyvärr uppstod ett fel på servern. Vänligen försök igen senare."
}

const unsafeChatMessageTranslations = {
    'es': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-mx': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-es': "Tu mensaje no cumple con la política de seguridad de la conversación.",
    'pl': "Twoja wiadomość nie spełnia polityki bezpieczeństwa rozmowy.",
    'en': "Your message does not meet the conversation security policy.",
    'ro': "Mesajul dvs. nu respectă politica de securitate a conversației.",
    'se': "Ditt meddelande uppfyller inte konversationens säkerhetspolicy."
}

const chatViolationMessageTranslations = {
    'es': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'es-mx': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'es-es': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'pl': "Czat zostało zakończone przez system z powodu poprzednich naruszeń polityki bezpieczeństwa. Proszę rozpocząć nowy czat.",
    'en': "The chat has been terminated by the system due to previous violations of the safety policy. Please start a new chat.",
    'ro': "Chatul a fost încheiat de sistem din cauza încălcărilor anterioare ale politicii de securitate. Vă rugăm să începeți un nou chat.",
    'se': "Chatten har avslutats av systemet på grund av tidigare överträdelser av säkerhetspolicyn. Vänligen starta en ny chatt."
}

const failedToSummarizeTranslations = {
    'es': "No se pudo resumir el chat. Por favor, inicie un nuevo chat.",
    'es-mx': "No se pudo resumir el chat. Por favor, inicie un nuevo chat.",
    'es-es': "No se pudo resumir el chat. Por favor, inicie un nuevo chat.",
    'pl': "Nie udało się resumować czatu. Proszę rozpocząć nowy czat.",
    'en': "Failed to summarize the chat. Please start a new chat.",
    'ro': "Nu s-a reușit rezumarea chatului. Vă rugăm să începeți un nou chat.",
    'se': "Misslyckades med att sammanfatta chatten. Vänligen starta en ny chatt."
}

export async function getAllChats(req: Request, res: Response) {
    try {
        const client_id = req.body.client_id;
        const chats = await AIModel.getAllChatsByClientId(client_id);
        return res.status(200).json({
            success: true,
            chats
        });
    } catch (error) {
        console.error('Error fetching all chats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export async function getSuggestions(req: Request, res: Response) {
    const body = req.body;
    try {
        const countries = [
            {
                code: 'mx',
                id: 2,
                lang: 'es-mx'
            },
            {
                code: 'es',
                id: 1,
                lang: 'es-es'
            },
            {
                code: 'pl',
                id: 14,
                lang: 'pl'
            },
            {
                code: 'ro',
                id: 12,
                lang: 'ro'
            },
            {
                code: 'se',
                id: 22,
                lang: 'se'
            }
        ]
        const langParam = (req.query.lang as string) || countries.filter(country => country.id === body.params.country)[0].lang;
        const suggestions = await AIModel.getSuggestions(langParam);
        return res.status(200).json({
            success: true,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export async function reportMessage(req: Request, res: Response) {
    const chatId = req.body.params.chat_id;
    const { answer_index, message } = req.body;
    if (!chatId) {
        return res.status(400).json({
            success: false,
            error: 'chat_id is required'
        });
    }
    if (answer_index === undefined || answer_index === null) {
        return res.status(400).json({
            success: false,
            error: 'answerIndex is required'
        });
    }
    if (!message) {
        return res.status(400).json({
            success: false,
            error: 'message is required'
        });
    }
    try {
        const chat = await AIModel.getChatById(chatId);
        const messageIndex = chat?.messages.findIndex(msg => msg.index === answer_index);
        if (messageIndex === -1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid answer index'
            });
        }
        const result = await AIModel.updateReportedMessages(chatId, { answer_index, message });
        return res.status(200).json({
            success: true,
            result: result?.reported_messages
        });
    } catch (error) {
        console.error('Error updating reported messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }

}

export async function shareChat(req: Request, res: Response) {
    const chatId = req.params.chat_id;
    const { is_public } = req.body;

    try {
        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'chat_id is required'
            });
        }

        if (typeof is_public !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'is_public must be a boolean'
            });
        }

        const updatedChat = await AIModel.updateChatPublicStatus(chatId, is_public);

        if (!updatedChat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        return res.status(200).json({
            success: true
        });
    } catch (error) {
        console.error('Error sharing chat:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export async function getHistory(req: Request, res: Response) {
    const chatId = req.body.params.chat_id;
    try {
        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'chat_id is required'
            });
        }

        const chat = await AIModel.getChatById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: 'Chat not found'
            });
        }

        return res.status(200).json({
            success: true,
            chat_id: chat.chat_id,
            is_terminated_by_system: chat.is_terminated_by_system, // deletable
            messages: chat.messages.map(msg => ({
                from: msg.role as ChatRole,
                data: msg.data,
                created: msg.created_at // deletable
            }))
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

export async function processRequest(req: Request, res: Response) {
    const body: ChatProperties = req.body;
    const countries = [
        {
            code: 'mx',
            id: 2,
            lang: 'es-mx'
        },
        {
            code: 'es',
            id: 1,
            lang: 'es-es'
        },
        {
            code: 'pl',
            id: 14,
            lang: 'pl'
        },
        {
            code: 'ro',
            id: 12,
            lang: 'ro'
        },
        {
            code: 'se',
            id: 22,
            lang: 'se'
        }
    ]
    const source = (req.query.source as string) || 'web';
    const langParam = (req.query.lang as string) || countries.filter(country => `${country.id}` === `${body.params.country}`)[0].lang;
    const lang: 'es-mx' | 'es-es' | 'pl' | 'en' = langParam as ('es-mx' | 'es-es' | 'pl' | 'en');
    try {

        const ip = req.headers['x-forwarded-for'] || req.ip || null;
        if (!body || !body.message || !body.params.client_id || !body.params.country || !body.params.provider) {
            return res.status(400).json({
                success: false,
                chat_id: 0,
                data: [
                    {
                        type: ContentDataType.Notification,
                        content: "Invalid request format"
                    }
                ],
            });
        }

        let chatWithId: ChatDbRecord | null = null;

        if (countries.filter(country => `${country.id}` === `${body.params.country}`).length === 0) {
            return res.status(400).json({
                success: false,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: "Invalid country code"
                    }
                ]
            });
        };

        const country = countries.filter(country => `${country.id}` === `${body.params.country}`)[0];

        console.log("STEP 1 - Request received:", body.message);

        if (!body.params.chat_id) chatWithId = await AIModel.initChat(body, `${ip}`);
        else chatWithId = await AIModel.getChatById(body.params.chat_id);

        console.log("STEP 2 - Request received");

        if (chatWithId === null) {
            return res.status(500).json({
                success: false,
                chat_id: body.params.chat_id,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: "Chat session not found and failed to be initialized"
                    }
                ]
            });
        }
        console.log("STEP 2 - Request received");

        await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
            role: ChatRole.User,
            data: [
                {
                    content: body.message
                }
            ]
        });
        console.log("STEP 4 - Request received");

        chatWithId = await AIModel.getChatById(chatWithId.chat_id) as ChatDbRecord

        console.log("CHAT 1", chatWithId)
        console.log("CHAT 1 ID", chatWithId.chat_id)

        if (!langParam || !['es-mx', 'es-es', 'pl', 'en', 'ro', 'se'].includes(langParam)) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                error: "Missing 'lang' query parameter or unsupported language",
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: `Your message should be either in either of these languages: es-mx, es-es, pl, en, ro, se`
                    }
                ]
            });
        }

        console.log("STEP 5 - Request received");

        if (chatWithId.is_terminated_by_system) {
            return res.status(200).json({
                success: false,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: chatViolationMessageTranslations[lang]
                    }
                ]
            });
        }

        console.log("STEP 6 - Request received");


        console.log("CHAT RECORD:", chatWithId);

        chatWithId = await AIModel.getChatById(chatWithId.chat_id) as ChatDbRecord;


        console.log("STEP 7 - Request received");
        console.log("DEBUG RECORD ", country)

        const offersAndIntents = await getSortedffersAndCategories(country.code);
        const chatIntent = await AIModel.getIntent(chatWithId, [...offersAndIntents.types.map(el => `intent_${el}`), ChatIntent.OTHER, ChatIntent.FINANCIAL_ADVICE, ChatIntent.PRODUCT_COMPARISON]);

        console.log("STEP 8 - Request received", chatIntent);

        if (chatIntent.intent === ChatIntent.OTHER) {
            await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                role: ChatRole.Assistant,
                data: [
                    {
                        type: ContentDataType.Markdown,
                        content: irrelevantChatMessageTranslations[lang]
                    }
                ]
            });
            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Markdown,
                        content: irrelevantChatMessageTranslations[lang]
                    }
                ]
            });
        }

        console.log("STEP 9 - Request received");

        let summaryFormat = req.query.summary_format ?? 'html';
        if (summaryFormat !== 'html' && summaryFormat !== 'markdown') {
            summaryFormat = 'html';
        }

        if (chatIntent.intent === ChatIntent.FINANCIAL_ADVICE) {
            const adviceSummary = await AIModel.summarizeChat(chatWithId, lang, summaryFormat as 'html' | 'markdown');
            if (adviceSummary) {
                await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                    role: ChatRole.System,
                    data: [
                        {
                            type: INTERNAL_MEMORY_TYPE,
                            content: JSON.stringify({
                                preferences: adviceSummary.preferences,
                                rolling_summary: adviceSummary.rolling_summary,
                                last_request: adviceSummary.last_request
                            })
                        }
                    ]
                });
            }
            const adviceMemoryContext = buildMemoryContext(adviceSummary ? {
                preferences: adviceSummary.preferences,
                rolling_summary: adviceSummary.rolling_summary,
                last_request: adviceSummary.last_request
            } : getLatestMemory(chatWithId));



            const adviceResponse = await getResponse({
                messages: [
                    {
                        role: ChatRole.System,
                        content: `
                    You're a multilingual financial advisor.
                    You must reply in: ${lang}. 
                    You must be clear and concise. Help the user resolve their latest financial problem that the user describes in his latter messages.
                    You must not use any information about the user that is not directly related to the problem. Ask to provide more info, if appropriate.
                    Use the memory context to resolve references and preferences.
                    Memory context (if available):\n${adviceMemoryContext || 'N/A'}
                    Here's the chat history with the user:

                    ----Chat history start-----
                    ${chatWithId.messages.map(el => `${el.role}: ${el.data[0].content}`).join('\n')}
                    ----Chat history end-----

                    Reply with the unstyled html output. Do not nest list tag inside paragraphs or divs.
                `
                    },
                ],
                aiProvider: LLMProvider.DEEPINFRA,
                schema: z.string(),
                model: DeepInfraModels.LLAMA4_MAVERICK_17B,
                temperature: 0.3,
                maxTokens: 3000,
            });
            await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                role: ChatRole.Assistant,
                data: [
                    {
                        type: summaryFormat === 'markdown' ? ContentDataType.Markdown : ContentDataType.Html,
                        content: adviceResponse
                    }
                ]
            });
            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: summaryFormat === 'markdown' ? ContentDataType.Markdown : ContentDataType.Html,
                        content: adviceResponse
                    }
                ]
            });
        }

        // let summaryFormat = req.query.summary_format ?? 'html';
        // if (summaryFormat !== 'html' && summaryFormat !== 'markdown') {
        //     summaryFormat = 'html';
        // }

        const chatSummary = await AIModel.summarizeChat(chatWithId, lang, summaryFormat as 'html' | 'markdown');

        if (chatSummary === null) {
            return res.status(200).json({
                success: false,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: failedToSummarizeTranslations[lang]
                    }
                ]
            });
        }

        await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
            role: ChatRole.System,
            data: [
                {
                    type: INTERNAL_MEMORY_TYPE,
                    content: JSON.stringify({
                        preferences: chatSummary.preferences,
                        rolling_summary: chatSummary.rolling_summary,
                        last_request: chatSummary.last_request
                    })
                }
            ]
        });

        const memoryContext = buildMemoryContext({
            preferences: chatSummary.preferences,
            rolling_summary: chatSummary.rolling_summary,
            last_request: chatSummary.last_request
        });

        if (chatSummary.can_decide === false) {
            await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                role: ChatRole.Assistant,
                data: [
                    {
                        type: summaryFormat === 'markdown' ? ContentDataType.Markdown : ContentDataType.Html,
                        content: chatSummary.motivation
                    }
                ]
            });
            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: summaryFormat === 'markdown' ? ContentDataType.Markdown : ContentDataType.Html,
                        content: summaryFormat === 'markdown' ? chatSummary.motivation : marked.parse(chatSummary.motivation)
                    }
                ]
            });
        }

        const intentType = chatIntent.intent.replace('intent_', '');
        const userIntentWithMemory = memoryContext ? `${chatSummary.user_intent_summary}\n\n${memoryContext}` : chatSummary.user_intent_summary;

        const [loanResponse, requestedOfferIds] = await Promise.all([
            AIModel.getRelevantOffersV2(offersAndIntents.offers, userIntentWithMemory, intentType),
            extractRequestedOfferIds({
                latestMessage: body.message,
                offers: offersAndIntents.offers.filter(offer => offer.offer_type.type === intentType),
                lang
            })
        ]);
    

        console.log("STEP 10 - Request received", { requestedOfferIds, loanResponse });

        let comparisonText: string | null = null;
        if (requestedOfferIds.length === 2) {
            const offerA = offersAndIntents.offers.find(offer => offer.id === requestedOfferIds[0]);
            const offerB = offersAndIntents.offers.find(offer => offer.id === requestedOfferIds[1]);
            if (offerA && offerB) {
                comparisonText = await buildComparisonText({
                    offerA,
                    offerB,
                    lang,
                    userIntent: chatSummary.user_intent_summary,
                    memoryContext
                });
            }
        }

        const textualResponse = await getResponse({
            messages: [
                {
                    role: ChatRole.System,
                    content: `You must reply in: ${lang}. Tell the user that there was found this amount of relevant financial offers for them: ${loanResponse.length || 0}, if there are no offers found tell the user that there are no offers found and suggest to adjust the query. Be brief and clear. Initial user intent: ${chatSummary.user_intent_summary}\nMemory context (if available):\n${memoryContext || 'N/A'}`
                },
            ],
            model: DeepInfraModels.LLAMA4_MAVERICK_17B,
            aiProvider: LLMProvider.DEEPINFRA,
            schema: z.string(),
            temperature: 0.3,
            maxTokens: 300,
        });



        if (source === 'app') {
            const resolvedOffers = await fetchOffersByIds(loanResponse, country.code);

            const appAnswerData = [
                ...(comparisonText ? [{ type: ContentDataType.Markdown, content: comparisonText }] : []),
                { type: ContentDataType.Markdown, content: textualResponse },
                { type: ContentDataType.AppOffers, content: resolvedOffers }
            ];

            await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                role: ChatRole.Assistant,
                data: appAnswerData
            });

            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                answer: appAnswerData
            });
        }

        const webAnswerData = [
            ...(comparisonText ? [{ type: ContentDataType.Markdown, content: comparisonText }] : []),
            { type: ContentDataType.Markdown, content: textualResponse },
            { type: ContentDataType.Offers, content: loanResponse }
        ];

        await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
            role: ChatRole.Assistant,
            data: webAnswerData
        });

        return res.status(200).json({
            success: true,
            chat_id: chatWithId.chat_id,
            answer: webAnswerData
        });

    } catch (error) {
        console.error('Error processing request 1:', error);
        try {
            const chatWithId = await AIModel.getChatById(req.body.params.chat_id)
            if (!chatWithId) {
                return res.status(500).json({
                    success: false,
                    answer: [
                        {
                            type: ContentDataType.Notification,
                            content: serverErrorTryLaterTranslations[lang]
                        }
                    ]
                });
            }
            await AIModel.saveMessageToChat(chatWithId.chat_id, true, {
                role: ChatRole.System,
                data: [
                    {
                        type: ContentDataType.Notification,
                        content: serverErrorTryLaterTranslations[lang]
                    }
                ]
            });

            return res.status(500).json({
                success: false,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: serverErrorTryLaterTranslations[lang]
                    }
                ]
            });

        } catch (error) {
            console.error('Error processing request 2:', error);
        }
        return res.status(500).json({
            success: false,
            answer: [
                {
                    type: ContentDataType.Notification,
                    content: serverErrorTryLaterTranslations[lang]
                }
            ]
        });
    }
}


export function processQuery() {
    return async (req: Request, res: Response) => {

    }
}