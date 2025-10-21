/* 
TODO:
1) improve the part of the code that checks the user data completeness to find a relevant offer. It should not be as strict as it is now.
2) improve routing and scroing based on JSON, not on LLM sentiment.
*/



import { Request, Response } from 'express';
import { AIModel, ChatDbRecord, ChatProperties } from '../models/AiModel.js';
import { ChatIntent, ChatRole, ContentDataType } from '../enums/enums.js';
import { getSortedffersAndCategories, sendToLLM } from '../utils/common.js';

const irrelevantChatMessageTranslations = {
    'es': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-mx': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-es': "Solo puedo ayudarte con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'pl': "Możę Ci pomóc z wyszukiwaniem kredytu, kartą debetową i kartą kredytową.",
    'en': "I can help you with loan search, debit card and credit card."
}

const serverErrorTryLaterTranslations = {
    'es': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-mx': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-es': "Lo siento, ha ocurrido un error en el servidor. Por favor, inténtelo de nuevo más tarde.",
    'pl': "Przepraszamy, wystąpił błąd serwera. Proszę spróbuj ponownie później.",
    'en': "Sorry, there was an error on the server. Please try again later."
}

const unsafeChatMessageTranslations = {
    'es': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-mx': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-es': "Tu mensaje no cumple con la política de seguridad de la conversación.",
    'pl': "Twoja wiadomość nie spełnia polityki bezpieczeństwa rozmowy.",
    'en': "Your message does not meet the conversation security policy."
}

const chatViolationMessageTranslations = {
    'es': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'es-mx': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'es-es': "El chat ha sido terminado por el sistema debido a violaciones previas de la política de seguridad. Por favor, inicie un nuevo chat.",
    'pl': "Czat zostało zakończone przez system z powodu poprzednich naruszeń polityki bezpieczeństwa. Proszę rozpocząć nowy czat.",
    'en': "The chat has been terminated by the system due to previous violations of the safety policy. Please start a new chat."
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
            messages: chat.messages.map(msg => ({
                from: msg.role as ChatRole,
                data: msg.data
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
        }
    ]
    const langParam = (req.query.lang as string) || countries.filter(country => country.id === body.params.country)[0].lang;
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

        if (countries.filter(country => country.id === body.params.country).length === 0) {
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

        const country = countries.filter(country => country.id === body.params.country)[0];

        if (!body.params.chat_id) chatWithId = await AIModel.initChat(body, `${ip}`);
        else chatWithId = await AIModel.getChatById(body.params.chat_id);

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

        await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
            role: ChatRole.User,
            data: [
                {
                    content: body.message
                }
            ]
        });

        chatWithId = await AIModel.getChatById(chatWithId.chat_id) as ChatDbRecord

        if (!langParam || !['es-mx', 'es-es', 'pl', 'en'].includes(langParam)) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                error: "Missing 'lang' query parameter or unsupported language",
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: "Your message should be either in Spanish or English or Polish"
                    }
                ]
            });
        }

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

        const isChatSafe = await AIModel.isMessageSafe(chatWithId);

        if (isChatSafe === false) {
            await AIModel.saveMessageToChat(chatWithId.chat_id, true, {
                role: ChatRole.System,
                data: [
                    {
                        type: ContentDataType.Notification,
                        content: unsafeChatMessageTranslations[lang]
                    }
                ]
            });
            return res.status(200).json({
                success: false,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: unsafeChatMessageTranslations[lang]
                    }
                ]
            })
        }

        chatWithId = await AIModel.getChatById(chatWithId.chat_id) as ChatDbRecord;

        const offersAndIntents = await getSortedffersAndCategories(country.code);
        const chatIntent = await AIModel.getIntent(chatWithId, [...offersAndIntents.types.map(el => `intent_${el}`), ChatIntent.OTHER]);

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

        const chatSummary = await AIModel.summarizeChat(chatWithId, lang);

        if (chatSummary === null) {
            return res.status(200).json({
                success: false,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Notification,
                        content: "Failed to summarize the chat, please try again"
                    }
                ]
            });
        }

        if (chatSummary.can_decide === false) {
            await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                role: ChatRole.Assistant,
                data: [
                    {
                        type: ContentDataType.Markdown,
                        content: chatSummary.motivation
                    }
                ]
            });
            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                answer: [
                    {
                        type: ContentDataType.Markdown,
                        content: chatSummary.motivation
                    }
                ]
            });
        }

        const loanResponse = await AIModel.getRelevantOffersV2(offersAndIntents.offers, chatSummary.user_intent_summary, chatIntent.intent.replace('intent_', ''));

        const textualResponse = await sendToLLM([
            {
                role: ChatRole.System,
                content: `You must reply in: ${lang}. Tell the user that there was found this amount of relevant financial offers for them: ${loanResponse.length || 0}, if there are no offers found tell the user that there are no offers found and suggest to adjust the query. Be brief and clear. Initial user intent: ${chatSummary.user_intent_summary}`
            },
        ], {
            model: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
            temperature: 0.3,
            maxTokens: 300,
        });

        await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
            role: ChatRole.Assistant,
            data: [
                {
                    type: ContentDataType.Markdown,
                    content: textualResponse
                },
                {
                    type: ContentDataType.Offers,
                    content: loanResponse
                }
            ]
        });
        return res.status(200).json({
            success: true,
            chat_id: chatWithId.chat_id,
            answer: [
                {
                    type: ContentDataType.Markdown,
                    content: textualResponse
                },
                {
                    type: ContentDataType.Offers,
                    content: loanResponse
                }
            ]
        });

    } catch (error) {
        console.error('Error processing request:', error);
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
            console.error('Error processing request:', error);
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