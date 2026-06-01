import { Request, Response } from 'express';
import { getAiProvider } from '../models/AiModel.js';
import { LLMProvider, DeepSeekModels } from '../enums/enums.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const analyzeImage = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
        res.status(400).json({ error: 'No image provided' });
        return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        res.status(400).json({ error: 'Invalid file type. Allowed: jpeg, png, gif, webp' });
        return;
    }

    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const prompt = typeof req.body.prompt === 'string' && req.body.prompt.trim()
        ? req.body.prompt.trim()
        : 'Extract the text from the image and convert it into a financial question ready to copy & paste. Reply in the language of the text in the image. Do not add any additional commentary, just provide the question.';

    try {
        const ai = getAiProvider(LLMProvider.DEEPSEEK);

        const completion = await ai.chat.completions.create({
            model: DeepSeekModels.GEMMA_4_31B_IT,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                        {
                            type: 'text',
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '';
        res.json({ text });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
};
