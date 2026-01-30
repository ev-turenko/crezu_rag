import { Request, Response } from 'express';

export function getConfig() {
    return async (req: Request, res: Response) => {
        // const app = req.query.app as string | undefined;
        // const platform = req.query.platform as string | undefined;
        return res.json({
            version: '1.0.0',
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth1', 'auth2', 'auth3', 'auth4', 'auth5'],
            regScreensPolicy: "enforce", // enforce | optional | disabled
            feedEndpoint: 'https://ai.cashium.pro/api/offer',
            inferenceEndpoint: 'https://ai.cashium.pro/api/inference',
            authEndpoint: 'https://auth.cashium.pro/api/v1/auth',
        })
    }
}

