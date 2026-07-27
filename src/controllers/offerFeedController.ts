import { Request, Response } from 'express';
import { COUNTRIES_CONFIG } from './countriesController.js';
import {
    getSortedffersAndCategories,
    fetchOffersFromCDNFeed,
    CDN_FEED_COUNTRIES,
    buildPublicOfferUrl,
} from '../utils/common.js';

const FINMATCHER_COUNTRIES = COUNTRIES_CONFIG.map(c => c.country_code);
export const OFFER_FEED_COUNTRIES = [...FINMATCHER_COUNTRIES, ...Array.from(CDN_FEED_COUNTRIES)];

// Fallback display names for offer_type.type when the source data has no offer_type.name
// (the CDN feed pipeline never sets one - see cdnOfferToOriginal in utils/common.ts).
const OFFER_TYPE_LABELS: Record<string, string> = {
    fast_loan: 'Préstamo',
    credit_card: 'Tarjeta de crédito',
    debit_card: 'Tarjeta de débito',
};

// Per-country CTA fallback ("Request loan", translated), used when an offer has
// no button_text of its own (finmatcher never returns one; the CDN feed sometimes
// omits it). Kept in each country's own language rather than a generic English default.
const DEFAULT_BUTTON_TEXT: Record<string, string> = {
    se: 'Ansök om lån',
    pl: 'Złóż wniosek o pożyczkę',
    es: 'Solicitar préstamo',
    mx: 'Solicitar préstamo',
    co: 'Solicitar préstamo',
    pe: 'Solicitar préstamo',
    de: 'Kredit beantragen',
    kz: 'Подать заявку на займ',
    lk: 'ණය ඉල්ලන්න',
    my: 'Mohon pinjaman',
    vn: 'Yêu cầu khoản vay',
    za: 'Doen aansoek om lening',
    ph: 'Humiling ng pautang',
    ua: 'Подати заявку на позику',
};

type FeedOfferDetail = { title: string; value: string };

type FeedOfferItem = {
    id: number | string;
    name: string;
    offer_type: string | null;
    offer_type_label: string | null;
    avatar: string;
    tags: string[];
    details: FeedOfferDetail[];
    button_text: string | null;
    url: string;
};

type FeedCountryResult = {
    country_code: string;
    total: number;
    items: FeedOfferItem[];
    error?: string;
};

async function fetchCountryFeed(countryCode: string): Promise<FeedCountryResult> {
    try {
        const offers = CDN_FEED_COUNTRIES.has(countryCode)
            ? await fetchOffersFromCDNFeed(countryCode)
            : (await getSortedffersAndCategories(countryCode)).offers;

        const items: FeedOfferItem[] = offers.map(o => {
            const offerType = o.offer_type as { type?: string; name?: string } | undefined;
            const type = offerType?.type ?? null;
            const rawHeaders = (o.headers ?? []) as Array<{ title?: string; value?: string }>;

            return {
                id: o.id,
                name: o.name,
                offer_type: type,
                offer_type_label: offerType?.name ?? (type ? OFFER_TYPE_LABELS[type] ?? type : null),
                avatar: o.avatar ?? '',
                tags: Array.isArray(o.tags) ? o.tags : [],
                details: rawHeaders
                    .filter((h): h is { title: string; value: string } => Boolean(h.title && h.value?.trim()))
                    .map(h => ({ title: h.title, value: h.value.trim() })),
                button_text: (typeof o.button_text === 'string' && o.button_text.trim())
                    ? o.button_text.trim()
                    : DEFAULT_BUTTON_TEXT[countryCode] ?? null,
                url: buildPublicOfferUrl(o.url, countryCode),
            };
        });

        return { country_code: countryCode, total: items.length, items };
    } catch {
        return { country_code: countryCode, total: 0, items: [], error: 'failed_to_fetch' };
    }
}

export class OfferFeedController {
    getFeed() {
        return async (req: Request, res: Response) => {
            const requested = typeof req.query.country_code === 'string'
                ? req.query.country_code.toLowerCase()
                : null;

            if (requested && !OFFER_FEED_COUNTRIES.includes(requested)) {
                return res.status(400).json({ error: 'unsupported_country', countries: OFFER_FEED_COUNTRIES });
            }

            const countries = requested ? [requested] : OFFER_FEED_COUNTRIES;
            const results = await Promise.all(countries.map(fetchCountryFeed));

            return res.status(200).json({ countries: results });
        };
    }
}
