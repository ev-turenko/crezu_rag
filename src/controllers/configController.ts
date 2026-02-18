import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';


function getRelevantAuthEndpoint(countryCode: string): string {
    if(countryCode.toLowerCase() === 'mx') {
        return 'https://finmart.mx/?from_app=com.finmatcher.app.ai&browser=external';
    } else {
        return `https://finmatcher.com/${countryCode}/?from_app=com.finmatcher.app.ai&browser=external`;
    }
}

export function getConfig() {
    return async (req: Request, res: Response) => {
        const countryCode = req.query.country_code as string | undefined;
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        const lang = req.query.lang as string | undefined;
        
        void lang
        void platform
        void appVersion
        void appName

        let client_id = req.query.client_id as string | undefined;
        if(!client_id) {
            // generate v4 uuid
            client_id = uuidv4();
        }
        return res.json({
            client_id: client_id,
            version: appBuildNumber,
            finalScreen: 'offers', // chat | offers
            offersScreenPolicy: 'with_offers', // with offers | empty where empty means that initially no offers will be shown to the user before initial requests
            feedDisclaimer: "AI generated suggestions. Consult with a professional before making decisions.",
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth1', 'auth2', 'auth3', 'auth4', 'auth5'],
            regScreensPolicy: "optional", // enforce | optional | disabled
            feedEndpoint: 'https://ai.finmatcher.com/api/offer',
            inferenceEndpoint: 'https://ai.finmatcher.com/api/inference', 
            authEndpoint: getRelevantAuthEndpoint(countryCode ? countryCode : 'es'), // endpoint for auth navigation
            dataEndpoint: 'https://data.cashium.pro/api/v1/data', // sends collected user data to this endpoint
            geoDataEndpoint: 'https://geoip.loanfinder24.com/geoip/', // sends user location data
        })
    }
}

