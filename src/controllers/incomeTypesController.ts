import { Request, Response } from 'express';

type IncomeType = {
    value: string;
    label: string;
};

const incomeTypesByLang: Record<'en' | 'es' | 'pl', IncomeType[]> = {
    en: [
        { value: 'salary', label: 'Salary' },
        { value: 'business', label: 'Business' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'investment', label: 'Investment' },
        { value: 'rental', label: 'Rental' },
        { value: 'pension', label: 'Pension' },
        { value: 'parents', label: 'Parents' },
        { value: 'other', label: 'Other' },
    ],
    es: [
        { value: 'salary', label: 'Salario' },
        { value: 'business', label: 'Negocios' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'investment', label: 'Inversión' },
        { value: 'rental', label: 'Alquiler' },
        { value: 'pension', label: 'Pensión' },
        { value: 'parents', label: 'Padres' },
        { value: 'other', label: 'Otro' },
    ],
    pl: [
        { value: 'salary', label: 'Wynagrodzenie' },
        { value: 'business', label: 'Biznes' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'investment', label: 'Inwestycja' },
        { value: 'rental', label: 'Wynajem' },
        { value: 'pension', label: 'Emerytura' },
        { value: 'parents', label: 'Rodzice' },
        { value: 'other', label: 'Inne' },
    ]
};

function normalizeLang(rawLang: string | undefined): 'en' | 'es' | 'pl' | null {
    if (!rawLang) return null;
    const lang = rawLang.toLowerCase();

    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('pl')) return 'pl';

    return null;
}

export const getIncomeTypes = (req: Request, res: Response) => {
    const langParam = req.query.lang as string | undefined;

    // If no lang parameter provided, default to English
    if (langParam === undefined) {
        return res.status(200).json([...incomeTypesByLang.en]);
    }

    const normalizedLang = normalizeLang(langParam);

    if (!normalizedLang) {
        return res.status(400).json({
            success: false,
            error: "Unsupported 'lang' query parameter. Supported: es, en, pl."
        });
    }

    return res.status(200).json([...incomeTypesByLang[normalizedLang]]);
};