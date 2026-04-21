import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PocketBase from 'pocketbase';
import z from 'zod';
import { InferenceRequest } from '../types/types.js';
import { escapeFilterValue, logRequestMetaInfo } from '../utils/common.js';

const feedDisclaimerByLang: Record<'en' | 'es' | 'pl' | 'sv', string> = {
    en: 'AI generated suggestions. Consult with a professional before making decisions.',
    es: 'Sugerencias generadas por IA. Consulte con un profesional antes de tomar decisiones.',
    pl: 'Sugestie wygenerowane przez AI. Przed podjęciem decyzji skonsultuj się ze specjalistą.',
    sv: 'AI-genererade förslag. Konsultera en professionell innan du fattar beslut.'
};

function normalizeConfigLang(rawLang: string | undefined): 'en' | 'es' | 'pl' | 'sv' {
    if (!rawLang) return 'en';

    const lang = rawLang.toLowerCase();

    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('pl')) return 'pl';
    if (lang.startsWith('sv')) return 'sv';
    return 'en';
}


function getRelevantAuthEndpoint(countryCode: string): string {
    if(countryCode.toLowerCase() === 'mx') {
        return 'https://finmart.mx/?from_app=com.finmatcher.app.ai&browser=external';
    } else if(countryCode.toLowerCase() === 'sv' || countryCode.toLowerCase() === 'se') {
        return 'https://finmatcher.se/?from_app=com.finmatcher.app.ai&browser=external';
    }
    else {
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
    if(countryCode.toLowerCase() === 'sv' || countryCode.toLowerCase() === 'se') {
        return 'https://finmatcher.se/anvandarvillkor/';
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
    if(countryCode.toLowerCase() === 'sv' || countryCode.toLowerCase() === 'se') {
        return 'https://finmatcher.se/integritetspolicy/';
    }
    return 'https://finmatcher.com/es/politica-de-privacidad/';
}

const appsflyerPayloadSchema = z.object({
    payload: z.object({
        campaign: z.string().optional().nullable(),
        af_adset: z.string().optional().nullable(),
    }),
    status: z.string(),
});

const OFERWALL_CAMPAIGN = [
    'oferwall_uacMXacc3980Cr130_alp', 
    'oferwall_uacMXacc2562Cr123_alp',
    'oferwall_uacMXacc3980Cr105_alp',
    'oferwall_uacMXacc2562Cr92_alp',
    '**_alp'
];

function matchesCampaign(value: string): boolean {
    return OFERWALL_CAMPAIGN.some(pattern => {
        if (pattern.startsWith('**')) {
            return value.includes(pattern.slice(2));
        }
        if (pattern.startsWith('*')) {
            return value.endsWith(pattern.slice(1));
        }
        return value === pattern;
    });
}

const ALLOWED_COUNTRY_CODES = new Set(['mx', 'es', 'pl', 'sv', 'se']);

async function getCountryCodeFromIp(ip: string): Promise<string | null> {
    try {
        const url = new URL('https://gw.crezu.com/geoip/');
        url.searchParams.set('ip', ip);
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json() as { success?: boolean; iso_code?: string };
        if (!data.success || !data.iso_code) return null;
        return data.iso_code.toLowerCase();
    } catch (e) {
        console.error('Error fetching geoip for ip', ip, e);
        return null;
    }
}

async function isCountryAllowed(ip: string): Promise<boolean> {
    console.log('Checking country for IP', ip);
    const countryCode = await getCountryCodeFromIp(ip);
    console.log('GeoIP country check', { ip, countryCode, allowed: countryCode ? ALLOWED_COUNTRY_CODES.has(countryCode) : false });
    if (!countryCode) return false;
    return ALLOWED_COUNTRY_CODES.has(countryCode);
}

async function isOferwallCampaign(
    pbSuperAdmin: PocketBase,
    userAgent: string,
    ip: string,
    callback?: (clientId: string) => void
): Promise<boolean> {
    try {
        const result = await pbSuperAdmin
            .collection('attributions')
            .getList(1, 1, {
                filter: `user_agent="${escapeFilterValue(userAgent)}" && last_ip="${escapeFilterValue(ip)}"`,
                fields: 'appsflyer_data,client_id,install_referrer',
            });
        
        console.log("TOTAL ITEMS FOUND FOR OFFERWALL CHECK", result.totalItems, { userAgent, ip });
        if (result.totalItems === 0) return false;

        const record = result.items[0] as Record<string, unknown>;
        const parsed = appsflyerPayloadSchema.safeParse(record.appsflyer_data);
        if (!parsed.success) {
            console.log("PARSING AF DATA ERROR", parsed.error);
            return false;
        };

        const { campaign, af_adset } = parsed.data.payload;

        const installReferrerC = (() => {
            const referrer = record.install_referrer as string | undefined;
            if (!referrer) return null;
            try {
                return new URLSearchParams(referrer).get('c');
            } catch {
                return null;
            }
        })();

        console.log('Attribution data for userAgent and ip', { userAgent, ip, campaign, af_adset, installReferrerC });
        try {
            if (callback) {
                const clientId = record.client_id as string;
                console.log('Invoking callback with clientId from attribution record', clientId);
                callback(clientId);
            }
        } catch (e) {
         }
        return (campaign != null && matchesCampaign(campaign))
            || (af_adset != null && matchesCampaign(af_adset))
            || (installReferrerC != null && matchesCampaign(installReferrerC));
    } catch (e) {
        console.error('Error checking offerwall campaign for userAgent and ip', { userAgent, ip }, e);
        return false;
    }
}

export function getConfig() {
    return async (req: InferenceRequest, res: Response) => {
        const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
                ?? req.socket.remoteAddress
                ?? '';
        const userAgent = req.headers['user-agent'] ?? '';
        const countryCode = req.query.country_code as string | undefined;
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        const lang = req.query.lang as string | undefined;

        console.log("QUERY STRING FROM CONFIG ENDPOINT", JSON.stringify({userAgent: userAgent, ip: ip, ...req.query}, null, 2));
        
        const normalizedLang = normalizeConfigLang(lang);
        void platform
        void appVersion
        void appName

        let client_id = req.query.client_id as string | undefined;
        if(!client_id) {
            client_id = uuidv4();
        }

        const [offerwallCampaign, countryAllowed] = await Promise.all([
            req.pbSuperAdmin
                ? isOferwallCampaign(req.pbSuperAdmin, userAgent, ip, (clientId) => {
                    client_id = clientId;
                    console.log('Client ID set from callback', client_id);
                })
                : Promise.resolve(false),
            isCountryAllowed(ip),
        ]);

        const offerwall = offerwallCampaign && countryAllowed;
        
        console.log('Determined offerwall status CLIENT ID', client_id, { offerwall, offerwallCampaign, countryAllowed, userAgent, ip });

        const finalScreen = offerwall ? 'offers' : 'chat';
        const isfe = !offerwall;

        console.log('Final screen decision CLIENT ID', client_id);

        const finalConfig = {
            client_id: client_id,
            version: appBuildNumber,
            finalScreen, // chat | offers
            offersScreenPolicy: 'with_offers', // with offers | empty, where empty means that initially no offers will be shown to the user before initial requests
            feedDisclaimer: feedDisclaimerByLang[normalizedLang],
            supportedLanguages: ['en', 'es', 'pl'],
            regScreens: ['auth2', 'auth3', 'auth4', 'auth5'], // auth1 | auth2 | auth3 | auth4 | auth5
            regScreensPolicy: "disabled", // enforce | optional | disabled
            feedEndpoint: 'https://ai.finmatcher.com/api/offer',
            inferenceEndpoint: 'https://ai.finmatcher.com/api/inference', 
            authEndpoint: getRelevantAuthEndpoint(countryCode ? countryCode : 'es'), // endpoint for auth navigation
            dataEndpoint: 'https://ai.finmatcher.com/api/profile/data', // sends collected user data to this endpoint
            geoDataEndpoint: 'https://gw.crezu.com/geoip/', // sends user location data
            profileEndpoint: 'https://finmatcher.com/api/auth/profile', // endpoint to get user profile, uses x-api-key header with uuid
            clientIdEndpoint: 'https://ai.finmatcher.com/api/client-id', // endpoint to resolve client_id by uuid, uses x-api-key header with uuid
            termsLink: getTermsLink(countryCode ? countryCode : 'es'),
            privacyLink: getPrivacyLink(countryCode ? countryCode : 'es'),
            searchEndpoint: 'https://ai.finmatcher.com/api/search', // endpoint for search queries
            isfe, // is feed empty – if empty, no offers will be shown before user searches for offers
            localizationEndpoint: 'https://ai.finmatcher.com/api/localization', // endpoint to get localized strings for the app
            maestra: {
                domain: '',
                endpointIos: '',
                endpointAndroid: '',
                shouldCreateCustomer: false,
                subscribeCustomerIfCreated: false,
            },
        }

        res.json({...finalConfig});

        if (req.pbSuperAdmin) {
            void logRequestMetaInfo(req.pbSuperAdmin, client_id, ip, userAgent, '/api/config', finalConfig);
        }
    }
}

