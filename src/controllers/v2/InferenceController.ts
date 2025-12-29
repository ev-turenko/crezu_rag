import type { Response } from 'express';
import { InferenceRequest } from '../../types.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { countries, getResponse, resolveTranslation } from '../../utils/common.js';
import { ContentDataType, DeepSeekModels } from '../../enums/enums.js';
import z from 'zod';
import { translations } from '../../utils/translations.js';



export class InferenceController {

    public static getAiResponse(): any {
        return async (req: InferenceRequest, res: Response): Promise<any> => {
            const schema = z.object({
                response_text: z.string().describe(
                    `The generated response text based on the user's message, using ${req.f_text_format} format.`
                ),
            });
            try {
                const messages: ChatCompletionMessageParam[] = req.f_messages || [];

                messages.unshift(
                    {
                        role: 'system',
                        content: `You're a helpful financial assistant. 
                                 Provide text in this output format: ${req.f_text_format}.
                                 Answer in user's language. 
                                 Pay attention to the overall context of the conversation:
                                 -----overall context start-----
                                ${req.f_summary?.general_summary || 'N/A'}
                                -----overall context end-----
                                Focus on the user's last intent summary: 
                                -----last intent start-----
                                ${req.f_summary?.last_intent_summary || 'N/A'}
                                -----last intent end------`
                    }
                );
                messages.push({ role: 'user', content: req.f_message });

                const { id, created, model, choices, usage } = await getResponse({
                    messages,
                    aiProvider: 'deepseek',
                    model: DeepSeekModels.CHAT,
                    schema: schema,
                    maxTokens: 1000,
                    jsonSchemaName: 'inference_response'
                })

                const result = JSON.parse(choices[0].message?.content?.trim() || '{}') as z.infer<typeof schema>;

                if (!result.response_text || result.response_text.trim().length === 0) {
                    return res.status(500).json({
                        success: false,
                        answer: []
                    })
                }

                return res.status(200).json({
                    success: true,
                    // messages,
                    // summary: req.f_summary,
                    chat_id: 0,
                    answer: [
                        {
                            type: ContentDataType.Markdown,
                            content: result.response_text.trim()
                        }
                    ],
                })
            } catch (error) {
                return res.status(200).json({
                    success: true,
                    chat_id: 0,
                    answer: [
                        {
                            type: ContentDataType.Markdown,
                            content: resolveTranslation(
                                req.f_country_id,
                                countries,
                                translations.generationErrorMessage
                            )
                        }
                    ],
                })
            }

        }
    }
}