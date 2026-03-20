import { Request, Response } from 'express';
import { COUNTRIES_CONFIG } from './countriesController.js';

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
            countries: [...COUNTRIES_CONFIG]
        });
    };
}
