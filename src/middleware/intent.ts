
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { countries, getResponse, resolveTranslation } from '../utils/common.js';
import { ChatRole, ContentDataType, DeepSeekModels, LLMProvider } from '../enums/enums.js';
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { translations } from '../utils/translations.js';
import { InferenceBody, InferenceRequest } from '../types/types.js';
import { AIModel, ChatDbRecord, ChatProperties } from '../models/AiModel.js';

const intentSchema = z.object({
    message_objective: z.enum(['DANGER', 'LOAN', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_ACCOUNT', 'FINANCE', 'OTHER']).describe(
        "The primary objective of the user's message. " +
        "- 'DANGER': The user is asking about something potentially harmful or unsafe. " +
        "- 'LOAN': The user is asking about a loan. " +
        "- 'CREDIT_CARD': The user is asking about a credit card. " +
        "- 'DEBIT_CARD': The user is asking about a debit card. " +
        "- 'BANK_ACCOUNT': The user is asking about a bank account. " +
        // "- 'CURRENCY_EXCHANGE': The user is asking about currency exchange. " +
        "- 'FINANCE': The user has a general financial question (e.g., investments, budgeting, taxes, credit score) that is not specifically about a loan. " +
        "- 'OTHER': Anything else that doesn't fit the above categories."
    ),
    confidence: z.number().min(0).max(1).describe(
        "The confidence level of the classification, ranging from 0 (no confidence) to 1 (high confidence)."
    ),
    language: z.string().describe(
        "The detected language of the user's message in ISO 639-1 format (e.g., 'en' for English, 'es' for Spanish)."
    )
});

const summarySchema = z.object({
    general_summary: z.string().describe(
        `A concise summary of the user's message, highlighting key points relevant to financial topics.`
    ),
    last_intent_summary: z.string().describe(
        `A brief summary of the user's most recent intent or request within the message.`
    )
});

const INTERNAL_MEMORY_TYPE = 'internal_memory';

function buildChatContext(chat: ChatDbRecord | null): string {
    if (!chat || !Array.isArray(chat.messages) || chat.messages.length === 0) {
        return '';
    }

    const recentMessages = chat.messages.slice(-8).map(msg => {
        const content = msg.data?.[0]?.content;
        const safeContent = typeof content === 'string' ? content : JSON.stringify(content);
        return `${msg.role}: ${safeContent}`;
    }).join('\n');

    const memoryMessage = [...chat.messages].reverse().find(msg =>
        msg.role === 'system' && Array.isArray(msg.data) && msg.data.some(item => item?.type === INTERNAL_MEMORY_TYPE)
    );
    const memoryRaw = memoryMessage?.data?.find(item => item?.type === INTERNAL_MEMORY_TYPE)?.content;
    let memorySummary = '';
    if (typeof memoryRaw === 'string' && memoryRaw.trim()) {
        try {
            const parsed = JSON.parse(memoryRaw);
            const prefEntries = Object.entries(parsed?.preferences ?? {});
            const preferencesText = prefEntries.length > 0
                ? `Preferences:\n${prefEntries.map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
                : '';
            const rollingSummary = parsed?.rolling_summary ? `Rolling summary:\n${parsed.rolling_summary}` : '';
            const lastRequest = parsed?.last_request ? `Last request: ${parsed.last_request}` : '';
            memorySummary = [lastRequest, preferencesText, rollingSummary].filter(Boolean).join('\n\n');
        } catch {
            memorySummary = '';
        }
    }

    return [memorySummary ? `Memory context:\n${memorySummary}` : '', recentMessages ? `Recent messages:\n${recentMessages}` : '']
        .filter(Boolean)
        .join('\n\n');
}

export function checkSafety(): any {
    return async (req: InferenceRequest, res: Response, next: NextFunction) => {
        const rawMessages = req.body?.messages ? JSON.parse(JSON.stringify(req.body.messages)) || [] : [];
        let messages: ChatCompletionMessageParam[] = rawMessages.map((msg: any) => ({
            role: msg.role as ChatCompletionMessageParam['role'],
            content: msg.content
        }));
        const body: InferenceBody = req.body;
        const guestQueryValue = Array.isArray(req.query?.is_guest) ? req.query.is_guest[0] : req.query?.is_guest;
        const isGuestChat = typeof guestQueryValue === 'string' && ['true', 'yes'].includes(guestQueryValue.trim().toLowerCase());
        const ip = req.headers['x-forwarded-for'] || req.ip || null;

        let chatWithId: ChatDbRecord | null = null;

        if (!body?.params?.country) {
            return res.status(400).json({
                success: false,
                message: resolveTranslation(
                    undefined,
                    countries,
                    translations.emptyCountryCodeMessage
                )
            })
        }

        messages.push({ role: 'user', content: req.body.message });

        if (req.body.message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: resolveTranslation(
                    body.params.country,
                    countries,
                    translations.emptyMessage
                )
            })
        }

        try {
            console.log(body.params)

            if (!body.params.chat_id) {
                chatWithId = await AIModel.initChat({
                    ...body,
                    params: {
                        ...body.params,
                        is_guest_chat: isGuestChat
                    }
                }, `${ip}`);
            }
            if (body.params.chat_id) chatWithId = await AIModel.getChatById(body.params.chat_id) as ChatDbRecord;
            if (chatWithId?.chat_id) {
                body.params.chat_id = chatWithId.chat_id;
                req.system = req.system || {};
                req.system.middleware_chat_id = chatWithId.chat_id;
            }
            console.log('Chat with ID:', chatWithId?.chat_id);

            if (messages.length === 0 && chatWithId?.messages?.length) {
                messages = chatWithId.messages
                    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                    .map(msg => {
                        const content = msg.data?.[0]?.content;
                        const safeContent = typeof content === 'string' ? content : JSON.stringify(content);
                        return {
                            role: msg.role as ChatCompletionMessageParam['role'],
                            content: safeContent
                        } as ChatCompletionMessageParam;
                    }) as ChatCompletionMessageParam[];
            }

            const contextText = buildChatContext(chatWithId);

            const contextMessages: ChatCompletionMessageParam[] = contextText
                ? [{ role: 'system', content: `Use the following context only if it helps classify the latest user message.\n${contextText}` }]
                : [];

            const [_savedMessageRecord, intentCheckResponse] = await Promise.all([
                AIModel.saveMessageToChat(chatWithId!.chat_id, false, {
                    role: ChatRole.User,
                    data: [
                        {
                            content: body.message
                        }
                    ]
                }),

                getResponse({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a multilingual text safety manager and intent classifier. Check the provided text and tell to which category it belongs based on provided schema. Loans are always LEGAL!`
                        },
                        ...contextMessages,
                        ...messages
                    ],
                    schema: intentSchema,
                    aiProvider: LLMProvider.DEEPSEEK,
                    model: DeepSeekModels.CHAT,
                    jsonSchemaName: 'safety_check',
                    maxTokens: 100
                })
            ])

            req.system = req.system || {};
            req.system.user_message_saved = true;

            console.log("Check point 1")
            console.log('Intent check response:', intentCheckResponse);
            const intentResult = JSON.parse(intentCheckResponse || '{}') as z.infer<typeof intentSchema>;
            console.log("Check point 2")
            if (['DANGER'].includes(intentResult.message_objective)) {
                const unsafeMessage = resolveTranslation(
                    body.params.country,
                    countries,
                    translations.unsafeChatMessage
                );

                if (chatWithId?.chat_id) {
                    await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                        role: ChatRole.Assistant,
                        data: [
                            {
                                type: ContentDataType.Markdown,
                                content: unsafeMessage
                            }
                        ]
                    });
                }

                return res.status(200).json({
                    success: true,
                    chat_id: chatWithId?.chat_id,
                    message: unsafeMessage,
                    answer: [
                        {
                            type: ContentDataType.Markdown,
                            content: unsafeMessage
                        }
                    ]
                })
            }

            if (['OTHER'].includes(intentResult.message_objective)) {
                const onlyFinanceMessage = resolveTranslation(
                    body.params.country,
                    countries,
                    translations.onlyFinanceMessage
                );

                if (chatWithId?.chat_id) {
                    await AIModel.saveMessageToChat(chatWithId.chat_id, false, {
                        role: ChatRole.Assistant,
                        data: [
                            {
                                type: ContentDataType.Markdown,
                                content: onlyFinanceMessage
                            }
                        ]
                    });
                }

                return res.status(200).json({
                    success: true,
                    chat_id: chatWithId?.chat_id,
                    answer: [
                        {
                            type: ContentDataType.Markdown,
                            content: onlyFinanceMessage
                        }
                    ]
                })
            }

            const summaryResponse = await getResponse({
                messages: [
                    {
                        role: 'system',
                        content: `You are a summarization guru. Summarize the provided the provided conversation in a concise manner, that would be helpful for a specialized LLM model or human expert.`
                    },
                    ...(contextText ? [{ role: 'system', content: `Context for summarization (use if relevant):\n${contextText}` } as ChatCompletionMessageParam] : []),
                    ...messages
                ],
                schema: summarySchema,
                aiProvider: LLMProvider.DEEPSEEK,
                model: DeepSeekModels.CHAT,
                jsonSchemaName: 'safety_check',
                maxTokens: 100
            });

            const summaryResult = JSON.parse(summaryResponse || '{}') as z.infer<typeof summarySchema>;

            req.system = req.system || {};
            req.system.summaries = summaryResult;

            next();

        } catch (error) {
            const serverErrorMessage = resolveTranslation(
                body.params.country,
                countries,
                translations.serverErrorMessage
            );
            return res.status(500).json({
                success: false,
                message: `1: ${serverErrorMessage}`,
                error: (error as Error).message
            })
        }
    }
}
