// TODO: добавить в прод подключение к базе данных по чатам
// TODO: добавить сравнение с другими профилями и их выбором
// TODO: дотестировать примешивание топовых офферов для нас

import { Request, Response } from 'express';
import { AIModel } from '../models/AiModel.js';
import { ChatRequest } from '../types.js';
import { ChatIntent, ChatRole, ContentDataType } from '../enums/enums.js';

const irrelevantChatMessageTranslations = {
    'es': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-mx': "Solo puedo ayudarle con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'es-es': "Solo puedo ayudarte con la busqueda de préstamos, tarjetas de débito y tarjetas de crédito.",
    'pl': "Możę Ci pomóc z wyszukiwaniem kredytu, kartą debetową i kartą kredytową.",
    'en': "I can help you with loan search, debit card and credit card."
}

const unknownTopicChatMessageTranslations = {
    'es': "Lo siento, no puedo ayudarte con eso.",
    'es-mx': "Lo siento, no puedo ayudarte con eso.",
    'es-es': "Lo siento, no puedo ayudarte con eso.",
    'pl': "Przepraszam, nie mogę Ci pomóc z tym.",
    'en': "Sorry, I can't help you with that."
}

const unsafeChatMessageTranslations = {
    'es': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-mx': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-es': "Tu mensaje no cumple con la política de seguridad de la conversación.",
    'pl': "Twoja wiadomość nie spełnia polityki bezpieczeństwa rozmowy.",
    'en': "Your message does not meet the conversation security policy."
}

export async function processRequest(req: Request, res: Response) {
    try {
        const body: ChatRequest = req.body;

        if (!body || !body.messages || !Array.isArray(body.messages)) {
            return res.status(400).json({
                success: false,
                chat_id: 0,
                messages: [
                    {
                        index: 0,
                        role: ChatRole.System,
                        data: [
                            {
                                type: ContentDataType.Notification,
                                content: "Invalid request format"
                            }
                        ]
                    }
                ],
            });
        }

        const langParam = req.query.lang;
        const chatWithId = AIModel.assignIdToChatSession(body);
        const lastMessageIndex = body.messages[body.messages.length - 1].index;

        // LANG QUERY PARAM SHOULD BE PROVIDED AT ALL TIMES
        if (!langParam || !['es-mx', 'es-es', 'pl', 'en'].includes(langParam as string)) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                type: ContentDataType.Notification,
                                content: "Your message should be either in Spanish or English or Polish"
                            }
                        ]
                    }
                ],
            });
        }
        const lang: 'es-mx' | 'es-es' | 'pl' | 'en' = langParam as ('es-mx' | 'es-es' | 'pl' | 'en');


        const isChatSafe = await AIModel.isMessageSafe(chatWithId);

        // CHAT ID SHOULD BE GENERATED/PROVIDED AT ALL TIMES
        if (!chatWithId.chat_id) {
            return res.status(500).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                type: ContentDataType.Notification,
                                content: "Internal system error, please try again"
                            }
                        ]
                    }
                ],
            });
        }

        if (isChatSafe === false) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    // ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                type: ContentDataType.Notification,
                                content: unsafeChatMessageTranslations[lang]
                            }
                        ]
                    }
                ],
            })
        }

        const chatIntent = await AIModel.getIntent(chatWithId);

        if (chatIntent.intent === ChatIntent.OTHER) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                content: irrelevantChatMessageTranslations[lang]
                            }
                        ]
                    }
                ],
            });
        }

        if (chatIntent.intent === ChatIntent.UNKNOWN) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                content: unknownTopicChatMessageTranslations[lang]
                            }
                        ]
                    }
                ],
            });
        }

        const loanResponse = await AIModel.getRelevantOffers(chatWithId, `${chatIntent.intent}`.split('_').join(' '));

        if(loanResponse.motivation === null) {
            return res.status(400).json({
                success: false,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.Assistant,
                        data: [
                            {
                                content: loanResponse.motivation
                            }
                        ]
                    }
                ],
            });
        } else {
            return res.status(200).json({
                success: true,
                chat_id: chatWithId.chat_id,
                messages: [
                    ...body.messages,
                    {
                        index: lastMessageIndex + 1,
                        role: ChatRole.System,
                        data: [
                            {
                                type: ContentDataType.Markdown,
                                content: loanResponse.motivation
                            },
                            {
                                type: ContentDataType.Offers,
                                content: loanResponse.offer_id_list
                            }
                        ]
                    }
                ],
            });
        }



        // Here the logic is to choose the most relevant variants of offers and provide json array and then provide the brief reasoning for its choice. 

        // return res.status(200).json({
        //     success: true,
        //     chat_id: chatWithId.chat_id,
        //     messages: body.messages,
        //     intent: {
        //         intent: chatIntent.intent,
        //         confidence: chatIntent.confidence
        //     },
        // });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}