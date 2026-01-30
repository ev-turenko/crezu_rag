import { Request, Response } from 'express';

export function getConfig() {
    return async (_: Request, res: Response) => {
        return res.json({
            version: '1.0.0',
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth1', 'auth2', 'auth3', 'auth4', 'auth5'],
            feedEndpoint: 'https://ai.cashium.pro/api/offer',
            inferenceEndpoint: 'https://ai.cashium.pro/api/inference',
            authEndpoint: 'https://auth.cashium.pro/api/v1/auth',
        })
    }
}

