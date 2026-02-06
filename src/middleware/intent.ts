
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { countries, getResponse, resolveTranslation } from '../utils/common.js';
import { ChatRole, DeepSeekModels } from '../enums/enums.js';
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { translations } from '../utils/translations.js';
import { InferenceBody, InferenceRequest } from '../types/types.js';
import { AIModel, ChatDbRecord, ChatProperties } from '../models/AiModel.js';

const intentSchema = z.object({
    message_objective: z.enum(['DANGER', 'LOAN', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_ACCOUNT', 'FINANCE', 'OTHER', 'CURRENCY_EXCHANGE']).describe(
        "The primary objective of the user's message. " +
        "- 'DANGER': The user is asking about something potentially harmful or unsafe. " +
        "- 'LOAN': The user is asking about a loan. " +
        "- 'CREDIT_CARD': The user is asking about a credit card. " +
        "- 'DEBIT_CARD': The user is asking about a debit card. " +
        "- 'BANK_ACCOUNT': The user is asking about a bank account. " +
        "- 'CURRENCY_EXCHANGE': The user is asking about currency exchange. " +
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

export function checkSafety(): any {
    return async (req: InferenceRequest, res: Response, next: NextFunction) => {
        const messages: ChatCompletionMessageParam[] = req.body?.messages ? JSON.parse(JSON.stringify(req.body.messages)) || [] : [];
        const body: InferenceBody = req.body;
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


            if (!body.params.chat_id) chatWithId = await AIModel.initChat(body as ChatProperties, `${ip}`);


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
                        ...messages
                    ],
                    schema: intentSchema,
                    aiProvider: 'deepseek',
                    model: DeepSeekModels.CHAT,
                    jsonSchemaName: 'safety_check',
                    maxTokens: 100
                })
            ])


            const intentResult = JSON.parse(intentCheckResponse.choices[0].message?.content?.trim() || '{}') as z.infer<typeof intentSchema>;

            if (['DANGER'].includes(intentResult.message_objective)) {
                const unsafeMessage = resolveTranslation(
                    body.params.country,
                    countries,
                    translations.unsafeChatMessage
                );

                return res.status(403).json({
                    success: false,
                    message: unsafeMessage,
                    meta: {
                        usage: intentCheckResponse.usage
                    }
                })
            }

            if (['OTHER'].includes(intentResult.message_objective)) {
                const onlyFinanceMessage = resolveTranslation(
                    body.params.country,
                    countries,
                    translations.onlyFinanceMessage
                );

                return res.status(200).json({
                    success: false,
                    message: onlyFinanceMessage,
                    meta: {
                        usage: intentCheckResponse.usage
                    }
                })
            }

            const summaryResponse = await getResponse({
                messages: [
                    {
                        role: 'system',
                        content: `You are a summarization guru. Summarize the provided the provided conversation in a concise manner, that would be helpful for a specialized LLM model or human expert.`
                    },
                    ...messages
                ],
                schema: summarySchema,
                aiProvider: 'deepseek',
                model: DeepSeekModels.CHAT,
                jsonSchemaName: 'safety_check',
                maxTokens: 100
            });

            const summaryResult = JSON.parse(summaryResponse.choices[0].message?.content?.trim() || '{}') as z.infer<typeof summarySchema>;

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
                message: serverErrorMessage,
                error: (error as Error).message
            })
        }
    }
}
