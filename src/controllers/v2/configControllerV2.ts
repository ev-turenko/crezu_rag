import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PocketBase from 'pocketbase';
import z from 'zod';
import { InferenceRequest } from '../../types/types.js';
import { escapeFilterValue, logRequestMetaInfo } from '../../utils/common.js';

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------

type SupportedLang = 'en' | 'es' | 'pl' | 'sv' | 'de' | 'ro' | 'ru' | 'uk' | 'vi' | 'ms';

const feedDisclaimerByLang: Record<SupportedLang, string> = {
    en: 'AI generated suggestions. Consult with a professional before making decisions.',
    es: 'Sugerencias generadas por IA. Consulte con un profesional antes de tomar decisiones.',
    pl: 'Sugestie wygenerowane przez AI. Przed podjęciem decyzji skonsultuj się ze specjalistą.',
    sv: 'AI-genererade förslag. Konsultera en professionell innan du fattar beslut.',
    de: 'KI-generierte Vorschläge. Konsultieren Sie einen Fachmann, bevor Sie Entscheidungen treffen.',
    ro: 'Sugestii generate de AI. Consultați un specialist înainte de a lua decizii.',
    ru: 'Предложения, сгенерированные ИИ. Проконсультируйтесь со специалистом перед принятием решений.',
    uk: 'Пропозиції, згенеровані ШІ. Проконсультуйтеся зі спеціалістом перед прийняттям рішень.',
    vi: 'Gợi ý được tạo bởi AI. Hãy tham khảo chuyên gia trước khi đưa ra quyết định.',
    ms: 'Cadangan dijana AI. Rujuk profesional sebelum membuat keputusan.',
};

function normalizeConfigLang(rawLang: string | undefined): SupportedLang {
    if (!rawLang) return 'en';
    const lang = rawLang.toLowerCase();
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('pl')) return 'pl';
    if (lang.startsWith('sv') || lang === 'se') return 'sv';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('ro')) return 'ro';
    if (lang.startsWith('ru')) return 'ru';
    if (lang.startsWith('uk')) return 'uk';
    if (lang.startsWith('vi')) return 'vi';
    if (lang.startsWith('ms')) return 'ms';
    return 'en';
}

// Primary language tag for each country (used in supportedLanguages response field).
const COUNTRY_LANGUAGES: Record<string, string[]> = {
    mx: ['es'], es: ['es'], co: ['es'], pe: ['es'],
    pl: ['pl'],
    se: ['sv'], sv: ['sv'],
    de: ['de'],
    kz: ['ru'],
    ro: ['ro'],
    ua: ['uk'],
    vn: ['vi'],
    my: ['ms'],
    lk: ['en'], ph: ['en'], za: ['en'],
};

function getSupportedLanguages(countryCode: string): string[] {
    return COUNTRY_LANGUAGES[countryCode.toLowerCase()] ?? ['en'];
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function getRelevantAuthEndpoint(countryCode: string): string {
    const code = countryCode.toLowerCase();
    if (code === 'mx') {
        return 'https://finmart.mx/?from_app=com.finmatcher.app.ai&browser=external';
    }
    if (code === 'sv' || code === 'se') {
        return 'https://finmatcher.se/?from_app=com.finmatcher.app.ai&browser=external';
    }
    return `https://finmatcher.com/${code}/?from_app=com.finmatcher.app.ai&browser=external`;
}

function getTermsLink(countryCode: string): string {
    const code = countryCode.toLowerCase();
    if (code === 'mx') return 'https://finmart.mx/terminos-y-condiciones/';
    if (code === 'es') return 'https://finmatcher.com/es/terminos-y-condiciones/';
    if (code === 'pl') return 'https://finmatcher.com/pl/terms-and-conditions/';
    if (code === 'sv' || code === 'se') return 'https://finmatcher.se/anvandarvillkor/';
    return `https://ai.finmatcher.com/${code}/terms-and-conditions/`;
}

function getPrivacyLink(countryCode: string): string {
    const code = countryCode.toLowerCase();
    if (code === 'mx') return 'https://finmart.mx/politica-de-privacidad/';
    if (code === 'es') return 'https://finmatcher.com/es/politica-de-privacidad/';
    if (code === 'pl') return 'https://finmatcher.com/pl/polityka-prywatnosci/';
    if (code === 'sv' || code === 'se') return 'https://finmatcher.se/integritetspolicy/';
    return `https://ai.finmatcher.com/legal/${code}/privacy-policy/`;
}

// ---------------------------------------------------------------------------
// Offerwall / country-allowlist logic
// ---------------------------------------------------------------------------

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
    '**_alp',
];

function matchesCampaign(_value: string): boolean {
    return true; // temp allow for all clients
}

// Original countries + new countries all allowed in v2.
const ALLOWED_COUNTRY_CODES_V2 = new Set([
    'mx', 'es', 'pl', 'sv', 'se',
    'co', 'de', 'kz', 'lk', 'my', 'pe', 'ph', 'ro', 'ua', 'vn', 'za',
]);

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
    const countryCode = await getCountryCodeFromIp(ip);
    if (!countryCode) return false;
    return ALLOWED_COUNTRY_CODES_V2.has(countryCode);
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

        if (result.totalItems === 0) return false;

        const record = result.items[0] as Record<string, unknown>;
        const parsed = appsflyerPayloadSchema.safeParse(record.appsflyer_data);
        if (!parsed.success) return false;

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

        try {
            if (callback) {
                const clientId = record.client_id as string;
                callback(clientId);
            }
        } catch { /* non-critical */ }

        return (campaign != null && matchesCampaign(campaign))
            || (af_adset != null && matchesCampaign(af_adset))
            || (installReferrerC != null && matchesCampaign(installReferrerC));
    } catch (e) {
        console.error('Error checking offerwall campaign', { userAgent, ip }, e);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export function getConfigV2() {
    return async (req: InferenceRequest, res: Response) => {
        const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
            ?? req.socket.remoteAddress
            ?? '';
        const userAgent = req.headers['user-agent'] ?? '';
        const countryCode = (req.query.country_code as string | undefined) ?? 'en';
        const appName = req.query.app_name as string | undefined;
        const appVersion = req.query.app_version as string | undefined;
        const appBuildNumber = req.query.app_build_number as string | undefined;
        const platform = req.query.platform as string | undefined;
        const lang = req.query.lang as string | undefined;

        void platform;
        void appVersion;
        void appName;

        const normalizedLang = normalizeConfigLang(lang ?? countryCode);

        let client_id = req.query.client_id as string | undefined;
        if (!client_id) {
            client_id = uuidv4();
        }

        const [offerwallCampaign, countryAllowed] = await Promise.all([
            req.pbSuperAdmin
                ? isOferwallCampaign(req.pbSuperAdmin, userAgent, ip, (clientId) => {
                    client_id = clientId;
                })
                : Promise.resolve(false),
            isCountryAllowed(ip),
        ]);

        const offerwall = offerwallCampaign && countryAllowed;
        const finalScreen = offerwall ? 'offers' : 'chat';
        const isfe = !offerwall;

        const finalConfig = {
            client_id,
            version: appBuildNumber,
            finalScreen,
            offersScreenPolicy: 'with_offers',
            feedDisclaimer: feedDisclaimerByLang[normalizedLang],
            supportedLanguages: getSupportedLanguages(countryCode),
            regScreens: ['auth2', 'auth3', 'auth4', 'auth5'],
            regScreensPolicy: 'disabled',
            feedEndpoint: 'https://ai.finmatcher.com/api/offer',
            inferenceEndpoint: 'https://ai.finmatcher.com/api/inference',
            authEndpoint: getRelevantAuthEndpoint(countryCode),
            dataEndpoint: 'https://ai.finmatcher.com/api/profile/data',
            geoDataEndpoint: 'https://gw.crezu.com/geoip/',
            profileEndpoint: 'https://finmatcher.com/api/auth/profile',
            clientIdEndpoint: 'https://ai.finmatcher.com/api/client-id',
            termsLink: getTermsLink(countryCode),
            privacyLink: getPrivacyLink(countryCode),
            searchEndpoint: 'https://ai.finmatcher.com/api/search',
            isfe,
            wvss: true,
            localizationEndpoint: 'https://ai.finmatcher.com/api/v2/localization',
            maestra: {
                domain: 'api.maestra.io',
                endpointIos: '',
                endpointAndroid: 'crezu.FinmatcherAndroidApp',
                shouldCreateCustomer: true,
                subscribeCustomerIfCreated: true,
            },
        };

        res.json({ ...finalConfig });

        if (req.pbSuperAdmin) {
            void logRequestMetaInfo(req.pbSuperAdmin, client_id, ip, userAgent, '/api/v2/config', finalConfig);
        }
    };
}
