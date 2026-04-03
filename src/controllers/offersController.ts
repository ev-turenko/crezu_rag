import { Response } from 'express';
import PocketBase from 'pocketbase';
import { OffersResponse } from '../types/offers.js';
import { InferenceRequest } from '../types/types.js';
import { escapeFilterValue } from '../utils/common.js';

type AttributionSubParams = {
    sub1: string | null; // appsflyer_id
    sub2: string | null; // media_source
    sub3: string | null; // af_channel
    sub4: string | null; // campaign
    sub5: string | null; // network
    sub6: string | null; // af_c_id
};

async function fetchAttributionSubParams(
    pbSuperAdmin: PocketBase,
    ip: string,
    userAgent: string
): Promise<AttributionSubParams | null> {
    try {
        const result = await pbSuperAdmin
            .collection('attributions')
            .getList(1, 1, {
                filter: `last_ip="${escapeFilterValue(ip)}" && user_agent="${escapeFilterValue(userAgent)}"`,
                fields: 'appsflyer_id,appsflyer_data',
                sort: '-created',
            });

        if (result.totalItems === 0) return null;

        const record = result.items[0] as Record<string, unknown>;
        const sub1 = typeof record.appsflyer_id === 'string' && record.appsflyer_id.trim()
            ? record.appsflyer_id.trim()
            : null;

        let payload: Record<string, unknown> = {};
        const rawData = record.appsflyer_data;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const nested = (rawData as Record<string, unknown>).payload;
            if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
                payload = nested as Record<string, unknown>;
            }
        }

        const extractStr = (key: string): string | null => {
            const v = payload[key];
            return typeof v === 'string' && v.trim() ? v.trim() : null;
        };

        return {
            sub1,
            sub2: extractStr('media_source'),
            sub3: extractStr('af_channel'),
            sub4: extractStr('campaign'),
            sub5: extractStr('network'),
            sub6: extractStr('af_c_id'),
        };
    } catch {
        return null;
    }
}

function appendSubParams(url: string, params: AttributionSubParams | null, offer_id: string | number): string {
    if (!params) return url;
    try {
        const u = new URL(url);
        const entries: [string, string | null][] = [
            ['sub1', params.sub2],
            ['sub2', "FinmatcherAI"],
            ['sub3', params.sub3],
            ['sub4', params.sub4],
            ['sub5', params.sub5],
            ['sub6', params.sub6],
            ['afid', params.sub1],
            ['sub8', String(offer_id)],
        ];
        for (const [key, value] of entries) {
            if (value !== null) {
                u.searchParams.set(key, value);
            } else {
                u.searchParams.delete(key);
            }
        }
        return u.toString();
    } catch {
        return url;
    }
}

export class OffersController {
    getOffers() {
        return async (req: InferenceRequest, res: Response) => {
            // Extract query parameters
            const {
                offer_type,
                country_code,
                is_preview,
                is_partner,
                with_inactive,
                id,
                page = 1,
                size = 30
            } = req.query;

            const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
                ?? req.socket.remoteAddress
                ?? '';
            const userAgent = req.headers['user-agent'] ?? '';

            const subParams = req.pbSuperAdmin
                ? await fetchAttributionSubParams(req.pbSuperAdmin, ip, userAgent)
                : null;

            // url: https://finmart.mx/api/offers 

            const params = new URLSearchParams();
            const appendParam = (key: string, value: unknown) => {
                if (value === undefined || value === null || value === '') return;
                if (Array.isArray(value)) {
                    value.forEach((item) => params.append(key, String(item)));
                    return;
                }
                params.append(key, String(value));
            };

            appendParam('offer_type', offer_type);
            appendParam('country_code', country_code);
            appendParam('is_preview', is_preview);
            appendParam('is_partner', is_partner);
            appendParam('with_inactive', with_inactive);
            appendParam('id', id);
            appendParam('page', page);
            appendParam('size', size);

            try {
                const baseUrl = 'https://api.finmatcher.com/api/offer/search?page=1&size=9000';
                // url.search = params.toString()

                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        country_code: `${country_code}`.toLowerCase(),
                        offer_type: "fast_loan",
                        sorting: { field: 'popular', order: 'desc' },
                        bank_ids: [],
                        benefits: [],
                        categories: [],
                        filters: [],
                    }),
                });

                // if (response.status !== 200) {
                //     console.error('Error fetching offers:', response.status);
                //     return res.status(200).json({ total: 0, items: [], page: 1, size: 30 });
                // }
                

                const data: OffersResponse = await response.json();
                if (subParams) {
                    data.items = data.items.map(item => {
                        let baseUrl;
                        if(`${country_code}`.toLowerCase() === 'mx') {
                            baseUrl = "https://crezufin.xyz/X2zSfS6w";
                        } else {
                            baseUrl = item.url;
                        }
                        return {
                            ...item,
                            url: appendSubParams(baseUrl, subParams, item.id),
                        }
                        
                        
                    });
                } else {
                    console.log('No subParams to append to offer URLs');
                }
                return res.status(200).json(data);
            } catch (error) {
                console.error('Error fetching offers:', error);
                return res.status(200).json({ total: 0, items: [], page: 1, size: 30 });
            }

        }
    }

}