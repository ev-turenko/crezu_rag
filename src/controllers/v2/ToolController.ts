import { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from "openai/resources.mjs";
import { getAiProvider } from "../../ai/client.js";
import { DeepInfraModels } from "../../enums/enums.js";
import { InferenceRequest } from "../../types.js";
import { Response } from "express";

export class ToolController {
    public static testToolCall(): any {
        return async (req: InferenceRequest, res: Response): Promise<any> => {
            try {

                const tools = [
                    {
                        type: "function" as const,
                        function: {
                            name: "get_horoscope",
                            description: "Get today's horoscope for an astrological sign.",
                            parameters: {
                                type: "object",
                                properties: {
                                    sign: {
                                        type: "string",
                                        description: "An astrological sign like Taurus or Aquarius",
                                    },
                                },
                                required: ["sign"],
                            },
                        },
                    },
                ];


                const messages: ChatCompletionMessageParam[] = [
                    { role: "user", content: "What is my horoscope? I am an Aquarius." },
                    {
                        role: "assistant",
                        content: "Aquarius Next Tuesday you will befriend a baby otter.",
                        tool_calls: [
                            {
                                id: "call_0",
                                type: "function",
                                function: {
                                    name: "get_horoscope",
                                    arguments: JSON.stringify({ sign: "Aquarius" })
                                }
                            }
                        ]
                    }
                ]

                return getAiProvider("deepinfra").chat.completions.create({
                    model: DeepInfraModels.LLAMA4_MAVERICK_17B,
                    tools: tools,
                    messages: messages,
                    temperature: 0,
                    response_format: {
                        type: 'json_object',
                    },
                    max_completion_tokens: 1000,
                });
            } catch (error: any) {
                console.error('Error in ToolController.testToolCall:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message || error.toString(),
                });
            }
        }
    }
}