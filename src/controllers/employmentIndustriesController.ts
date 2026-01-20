import { Request, Response } from 'express';

type Industry = {
    value: string;
    label: string;
};

const employmentIndustriesByLang: Record<'en' | 'es' | 'pl', Industry[]> = {
    en: [
        { value: 'agriculture', label: 'Agriculture' },
        { value: 'construction', label: 'Construction' },
        { value: 'education', label: 'Education' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'hospitality', label: 'Hospitality' },
        { value: 'information_technology', label: 'Information Technology' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'public_sector', label: 'Public Sector' },
        { value: 'retail', label: 'Retail' },
        { value: 'transportation', label: 'Transportation' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'other', label: 'Other' },
    ],
    es: [
        { value: 'agriculture', label: 'Agricultura' },
        { value: 'construction', label: 'Construcción' },
        { value: 'education', label: 'Educación' },
        { value: 'finance', label: 'Finanzas' },
        { value: 'healthcare', label: 'Salud' },
        { value: 'hospitality', label: 'Hostelería' },
        { value: 'information_technology', label: 'Tecnologías de la Información' },
        { value: 'manufacturing', label: 'Manufactura' },
        { value: 'public_sector', label: 'Sector público' },
        { value: 'retail', label: 'Comercio minorista' },
        { value: 'transportation', label: 'Transporte' },
        { value: 'utilities', label: 'Servicios públicos' },
        { value: 'other', label: 'Otro' }
    ],
    pl: [
        { value: 'agriculture', label: 'Rolnictwo' },
        { value: 'construction', label: 'Budownictwo' },
        { value: 'education', label: 'Edukacja' },
        { value: 'finance', label: 'Finanse' },
        { value: 'healthcare', label: 'Opieka zdrowotna' },
        { value: 'hospitality', label: 'Hotelarstwo i gastronomia' },
        { value: 'information_technology', label: 'Technologie informatyczne' },
        { value: 'manufacturing', label: 'Produkcja' },
        { value: 'public_sector', label: 'Sektor publiczny' },
        { value: 'retail', label: 'Handel detaliczny' },
        { value: 'transportation', label: 'Transport' },
        { value: 'utilities', label: 'Usługi komunalne' },
        { value: 'other', label: 'Inne' }
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

export const getEmploymentIndustries = (req: Request, res: Response) => {
    const langParam = req.query.lang as string | undefined;

    // If no lang parameter provided, default to English
    if (langParam === undefined) {
        return res.status(200).json([...employmentIndustriesByLang.en]);
    }

    const normalizedLang = normalizeLang(langParam);

    if (!normalizedLang) {
        return res.status(400).json({
            success: false,
            error: "Unsupported 'lang' query parameter. Supported: es, en, pl."
        });
    }

    return res.status(200).json([...employmentIndustriesByLang[normalizedLang]]);
};