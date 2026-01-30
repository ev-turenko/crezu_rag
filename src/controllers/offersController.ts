import { Request, Response } from 'express';
import { OffersResponse } from '../types/offers.js';

export class OffersController {
    getOffers() {
        return async (req: Request, res: Response) => {
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
                const url = new URL('https://finmatcher.com/api/offer');
                url.search = params.toString();

                const response = await fetch(url.toString());

                if (response.status !== 200) {
                    return res.status(200).json({ total: 0, items: [], page: 1, size: 30 });
                }

                const data: OffersResponse = await response.json();
                return res.status(200).json(data);
            } catch (error) {
                console.error('Error fetching offers:', error);
                return res.status(200).json({ total: 0, items: [], page: 1, size: 30 });
            }

        }
    }

}