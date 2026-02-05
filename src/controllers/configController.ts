import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function getConfig() {
    return async (req: Request, res: Response) => {
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        const lang = req.query.lang as string | undefined;
        let client_id = req.query.client_id as string | undefined;
        if(!client_id) {
            // generate v4 uuid
            client_id = uuidv4();
        }
        return res.json({
            client_id: client_id,
            version: appBuildNumber,
            feedDisclaimer: "AI generated suggestions. AI data may be outdated or inaccurate.",
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

