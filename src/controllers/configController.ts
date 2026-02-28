import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const feedDisclaimerByLang: Record<'en' | 'es' | 'pl', string> = {
    en: 'AI generated suggestions. Consult with a professional before making decisions.',
    es: 'Sugerencias generadas por IA. Consulte con un profesional antes de tomar decisiones.',
    pl: 'Sugestie wygenerowane przez AI. Przed podjęciem decyzji skonsultuj się ze specjalistą.',
};

function normalizeConfigLang(rawLang: string | undefined): 'en' | 'es' | 'pl' {
    if (!rawLang) return 'en';

    const lang = rawLang.toLowerCase();

    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('pl')) return 'pl';
    return 'en';
}


function getRelevantAuthEndpoint(countryCode: string): string {
    if(countryCode.toLowerCase() === 'mx') {
        return 'https://finmart.mx/?from_app=com.finmatcher.app.ai&browser=external';
    } else {
        return `https://finmatcher.com/${countryCode}/?from_app=com.finmatcher.app.ai&browser=external`;
    }
}


function getTermsLink(countryCode: string): string {
    if(countryCode.toLowerCase() === 'mx') {
        return 'https://finmart.mx/terminos-y-condiciones/';
    }
    if(countryCode.toLowerCase() === 'es') {
        return 'https://finmatcher.com/es/terminos-y-condiciones/';
    }
    if(countryCode.toLowerCase() === 'pl') {
        return 'https://finmatcher.com/pl/terms-and-conditions/';
    }
    return 'https://finmatcher.com/es/terminos-y-condiciones/';
}

function getPrivacyLink(countryCode: string): string {
    if(countryCode.toLowerCase() === 'mx') {
        return 'https://finmart.mx/politica-de-privacidad/';
    }
    if(countryCode.toLowerCase() === 'es') {
        return 'https://finmatcher.com/es/politica-de-privacidad/';
    }
    if(countryCode.toLowerCase() === 'pl') {
        return 'https://finmatcher.com/pl/polityka-prywatnosci/';
    }
    return 'https://finmatcher.com/es/politica-de-privacidad/';
}

export function getConfig() {
    return async (req: Request, res: Response) => {
        const countryCode = req.query.country_code as string | undefined;
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        const lang = req.query.lang as string | undefined;
        
        const normalizedLang = normalizeConfigLang(lang);
        void platform
        void appVersion
        void appName

        let client_id = req.query.client_id as string | undefined;
        if(!client_id) {
            client_id = uuidv4();
        }
        return res.json({
            client_id: client_id,
            version: appBuildNumber,
            finalScreen: 'offers', // chat | offers
            offersScreenPolicy: 'with_offers', // with offers | empty where empty means that initially no offers will be shown to the user before initial requests
            feedDisclaimer: feedDisclaimerByLang[normalizedLang],
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth2', 'auth3', 'auth4', 'auth5'], // auth1 | auth2 | auth3 | auth4 | auth5
            regScreensPolicy: "optional", // enforce | optional | disabled
            feedEndpoint: 'https://ai.finmatcher.com/api/offer',
            inferenceEndpoint: 'https://ai.finmatcher.com/api/inference', 
            authEndpoint: getRelevantAuthEndpoint(countryCode ? countryCode : 'es'), // endpoint for auth navigation
            dataEndpoint: 'https://data.cashium.pro/api/v1/data', // sends collected user data to this endpoint
            geoDataEndpoint: 'https://geoip.loanfinder24.com/geoip/', // sends user location data
            profileEndpoint: 'https://finmatcher.com/api/auth/profile', // endpoint to get user profile, uses x-api-key header with uuid
            clientIdEndpoint: 'https://ai.finmatcher.com/api/client-id', // endpoint to resolve client_id by uuid, uses x-api-key header with uuid
            termsLink: getTermsLink(countryCode ? countryCode : 'es'),
            privacyLink: getPrivacyLink(countryCode ? countryCode : 'es'),
            isfe: true // is feed empty – if empty, no offers will be shown before user searches for offers
        })
    }
}

