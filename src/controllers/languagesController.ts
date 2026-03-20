import { Request, Response } from 'express';

export function getLanguages() {
    return async (_req: Request, res: Response) => {
        return res.status(200).json({
            success: true,
            languages: [
                { code: 'en' },
                { code: 'es' },
                { code: 'pl' },
                { code: 'sv' }
            ],
            countries: [
                { provider: '374', country_code: 'ES', country_id: 'es' },
                { provider: '373', country_code: 'MX', country_id: 'mx' },
                { provider: '375', country_code: 'PL', country_id: 'pl' },
                { provider: '377', country_code: 'SE', country_id: 'se' }
            ]
        });
    };
}
