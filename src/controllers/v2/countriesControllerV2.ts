import { Request, Response } from 'express';
import { COUNTRIES_CONFIG } from '../countriesController.js';

export const COUNTRIES_CONFIG_V2 = [
    ...COUNTRIES_CONFIG,
    {
        provider: null,
        country_code: 'ua',
        country_id: '7'
    },
    {
        provider: null,
        country_code: 'vn',
        country_id: '9'
    },
    {
        provider: null,
        country_code: 'lk',
        country_id: '10'
    },
    {
        provider: null,
        country_code: 'de',
        country_id: '21'
    },
    {
        provider: null,
        country_code: 'my',
        country_id: '20'
    },
    {
        provider: null,
        country_code: 'ph',
        country_id: '3'
    },
    {
        provider: null,
        country_code: 'pe',
        country_id: '5'
    },
    {
        provider: null,
        country_code: 'za',
        country_id: '17'
    },
    {
        provider: null,
        country_code: 'co',
        country_id: '6'
    },
    {
        provider: null,
        country_code: 'kz',
        country_id: '8'
    },
];

export function getCountriesV2() {
    return async (_req: Request, res: Response) => {
        return res.status(200).json({
            success: true,
            languages: [
                { code: 'en' },
                { code: 'es' },
                { code: 'pl' },
                { code: 'sv' },
                { code: 'vi' },
                { code: 'uk' },
                { code: 'de' },
                { code: 'ms' },
                { code: 'fil' },
                { code: 'si' },
            ],
            data: [...COUNTRIES_CONFIG_V2]
        });
    };
}
