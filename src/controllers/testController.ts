import type { Response } from 'express';
import { InferenceRequest } from '../types/types.js';

export const testMiddleware = async (req: InferenceRequest, res: Response) => {
    try {
        // If we reach here, the middleware has passed successfully
        const { system } = req
        const { message, messages, params } = req.body;

        return res.status(200).json({
            success: true,
            message: 'Middleware test passed successfully',
            data: {
                receivedMessage: message,
                messageCount: messages?.length || 0,
                country: params.country,
                summaries: system?.summaries || null,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Test endpoint error',
            error: (error as Error).message
        });
    }
};
