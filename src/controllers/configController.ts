import { Request, Response } from 'express';

export function getConfig() {
    return async (req: Request, res: Response) => {
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        return res.json({
            version: appBuildNumber,
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth1', 'auth2', 'auth3', 'auth4', 'auth5'],
            regScreensPolicy: "enforce", // enforce | optional | disabled
            feedEndpoint: 'https://ai.cashium.pro/api/offer',
            inferenceEndpoint: 'https://ai.cashium.pro/api/inference',
            authEndpoint: 'https://auth.cashium.pro/api/v1/auth',
            dataEndpoint: 'https://data.cashium.pro/api/v1/data',
        })
    }
}

