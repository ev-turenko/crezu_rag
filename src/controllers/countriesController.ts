import { Request, Response } from 'express';



export function getCountries() {
    return async (_req: Request, res: Response) => {
        return res.status(200).json({
            success: true,
            data: [
                {
                    provider: '377',
                    country_code: 'se',
                    country_id: '22'
                },
                {
                    provider: '376',
                    country_code: 'ro',
                    country_id: '12'
                },
                {
                    provider: '375',
                    country_code: 'pl',
                    country_id: '14'
                },
                {
                    provider: '374',
                    country_code: 'es',
                    country_id: '1'
                },
                {
                    provider: '373',
                    country_code: 'mx',
                    country_id: '2'
                }
            ]
        });
    };
}

