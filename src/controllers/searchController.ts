import { InferenceRequest } from "../types/types.js";
import { Response } from "express";
import { getResponse } from "../utils/common.js";
import { LLMProvider, DeepSeekModels } from "../enums/enums.js";
import z from "zod";

interface Category {
    name: string;
    value: string;
}

interface CategoryGroup {
    id: number;
    name: string;
    categories: Category[];
}

function mergeAllCategoryValues(groups: CategoryGroup[]): string[] {
    return groups
        .flatMap(group => group.categories)
        .map(category => category.value);
}

async function getOfferCategories(countryCode: string, offerType: string): Promise<string[]> {
    try {
        const response = await fetch(`https://api.finmatcher.com/api/offer/categories/group?country_code=${countryCode}&offer_type=${offerType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        console.log('Fetched offer categories:', data);
        const groups = Array.isArray(data) ? data : data.groups || [];
        const allCategories = mergeAllCategoryValues(groups);
        console.log('Merged categories:', allCategories);
        return allCategories;
    } catch (error: any) {
        console.error('Error fetching offer categories:', error);
        return [];
    }
}


async function getBestFitCategory(query: string, categories: string[]): Promise<string[]> {
    try {
        if (categories.length === 0) {
            console.warn('No categories available for classification, returning empty array');
            return [];
        }
        const messages = [
            {
                role: "system" as const,
                content: `You are a helpful multilingual assistant that categorizes user search queries into specific offer categories. The available categories are: ${categories.join(', ')}. Analyze the user's search query and respond with UP TO 2 categories that best match the user's intent, ranked by relevance, do not use categories that obviously mean the same as the provided offer type`
            },
            {
                role: "user" as const,
                content: query
            }
        ];

        const response = await getResponse({
            messages: messages,
            schema: z.object({
                categories: z.array(z.enum(categories)).max(2)
            }).strict(),
            aiProvider: LLMProvider.DEEPSEEK,
            model: DeepSeekModels.CHAT,
            temperature: 0.0,
            maxTokens: 100
        });

        const parsed = JSON.parse(response);
        console.log('LLM response for category classification:', parsed);
        return parsed.categories && parsed.categories.length > 0 ? parsed.categories : [categories[0]];
    } catch (error: any) {
        console.error('Error classifying category:', error);
        return [categories[0]];
    }
}   

async function getOfferType(query: string, countryCode: string | undefined = undefined): Promise<string | null> {
    let possibleOfferTypes: string[] = [];
    if (countryCode === "mx" || countryCode === "es") possibleOfferTypes = ['credit_card', 'debit_card', 'fast_loan'];
    if (countryCode === "pl") possibleOfferTypes = ['credit_card', 'fast_loan'];
    if (countryCode === "se") possibleOfferTypes = ['fast_loan'];
    if (countryCode === "se") {
        return 'fast_loan';
    }

    const allTypes = ['not_related', ...possibleOfferTypes] as [string, ...string[]];

    try {
        const messages = [
            {
                role: "system" as const,
                content: `You are a multilingual expert at categorizing financial product search queries. Classify the user's search query into one of these offer types: ${possibleOfferTypes.join(', ')}. If the query is not related to any of these financial products, respond with "not_related". Respond with ONLY the offer type that best matches the user's intent.`
            },
            {
                role: "user" as const,
                content: query
            }
        ];

        const response = await getResponse({
            messages: messages,
            schema: z.object({
                offer_type: z.enum(allTypes)
            }).strict(),
            aiProvider: LLMProvider.DEEPSEEK,
            model: DeepSeekModels.CHAT,
            temperature: 0.0,
            maxTokens: 100
        });

        const parsed = JSON.parse(response);
        console.log('LLM response for offer type classification:', parsed);
        if (!parsed.offer_type || parsed.offer_type === 'not_related') return null;
        return parsed.offer_type;
    } catch (error: any) {
        console.error('Error classifying offer type:', error);
        return null;
    }
}

export function handleSearch() {
    return async (req: InferenceRequest, res: Response) => {
        try {

            const query = req.body?.query || req.query?.query || req.query?.search || req.body?.search;
            const countryCode = req.body?.country_code || req.query?.country_code;

            console.log('Received search query:', query);



            const offerType = await getOfferType(query, `${countryCode}`.toLowerCase());

            if (!offerType) {
                return res.status(200).json({
                    total: 0,
                    items: [],
                    page: 1,
                    size: 9000,
                    success: true,
                    error: null,
                    classified_offer_type: "",
                    best_fit_categories: []
                });
            }

            const categories = await getOfferCategories(`${countryCode}`.toLowerCase(), offerType);
            const bestFitCategories = await getBestFitCategory(query, categories);
            console.log('Classified offer type:', offerType);
            console.log('Best fit categories:', bestFitCategories);


            // no offers for visa and mastercard, so they are removed for now
            if (offerType === 'debit_card' || offerType === 'credit_card') {
                console.log('Filtering out visa and mastercard categories for credit/debit card offer type');
                console.log('Categories before filtering:', bestFitCategories);
                const filteredCategories = bestFitCategories.filter(category => category.toLowerCase() !== 'visa' && category.toLowerCase() !== 'mastercard');
                bestFitCategories.length = 0;
                bestFitCategories.push(...filteredCategories);
            }


            console.log('Final categories after filtering:', bestFitCategories);


            const url = new URL('https://api.finmatcher.com/api/offer/search?page=1&size=9000');

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country_code: `${countryCode}`.toLowerCase(),
                    offer_type: offerType,
                    sorting: { field: 'popular', order: 'desc' },
                    bank_ids: [],
                    benefits: [],
                    categories: bestFitCategories,
                    filters: [],
                }),
            });
            return res.status(200).json({
                ...await response.json(),
                success: true,
                error: null,
                classified_offer_type: offerType,
                best_fit_categories: bestFitCategories
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                data: null,
                success: false,
                error: 'Internal server error'
            });
        }
    }
}