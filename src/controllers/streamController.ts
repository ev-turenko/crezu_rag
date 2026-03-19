import { Response } from 'express';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { ChatRole, ContentDataType, DeepInfraModels, DeepSeekModels, LLMProvider } from '../enums/enums.js';
import { fetchOffersByIds, getResponse, getSortedffersAndCategories, normalizeOfferForLLM, OriginalOfferData, countries } from '../utils/common.js';
import { AIModel, getAiProvider } from '../models/AiModel.js';
import { InferenceRequest } from '../types/types.js';
import z from 'zod';

type ToolStatus = 'queued' | 'running' | 'done' | 'error';
type AllowedMessageRole = 'system' | 'assistant' | 'user';

type StreamToolDefinition = {
    name: string;
    description?: string;
    args?: Record<string, unknown>;
};

/** Hydrated offer returned by fetchOffersByIds */
type FetchedOffer = {
    id: number;
    name: string;
    url: string;
    avatar?: string;
    headers: unknown[];
    button_text: null;
};

/** Offer ranked/selected by the reasoning tool */
type RankedOffer = {
    offer: FetchedOffer;
};

/**
 * Pipeline state shared across tools in a single request.
 * Each tool can read from and write to this object, enabling
 * data to flow automatically from one stage to the next.
 */
type PipelineState = {
    /** Raw offers loaded from the finmatcher API, sorted by RPC */
    rawOffers: OriginalOfferData[];
    /** Resolved country code for the current request */
    countryCode: string;
    /** Full offer details after AI relevance filtering + top-RPC merge */
    combinedOfferDetails: FetchedOffer[];
    /** Offers selected and ranked by the reasoning tool */
    reasonedOffers: RankedOffer[];
    /** Final app_offers array produced by format_app_offers */
    formattedAppOffers: FetchedOffer[];
};

/**
 * Extended context passed to every tool handler.
 * `pipeline` allows tools to share intermediate results
 * without needing to re-fetch data.
 */
type StreamToolContext = {
    body: Record<string, unknown>;
    pipeline: PipelineState;
};

type StreamToolHandler = (args: Record<string, unknown>, context: StreamToolContext) => Promise<unknown>;

type AssistantDataItem = {
    type: string;
    content: unknown;
};

interface ToolUsageRecord {
    name: string;
    description?: string;
    status: ToolStatus;
    result?: unknown;
    error?: string;
    updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeOfferType(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized || null;
}

function toNumericIds(ids: unknown): number[] {
    if (!Array.isArray(ids)) {
        return [];
    }
    return ids
        .map(id => (typeof id === 'number' ? id : typeof id === 'string' ? Number.parseInt(id, 10) : Number.NaN))
        .filter((id): id is number => !Number.isNaN(id));
}

function createEmptyPipeline(): PipelineState {
    return {
        rawOffers: [],
        countryCode: 'mx',
        combinedOfferDetails: [],
        reasonedOffers: [],
        formattedAppOffers: [],
    };
}

// ---------------------------------------------------------------------------
// Reasoning helper – selects & explains the best N offers via LLM
// ---------------------------------------------------------------------------

const reasoningSchema = z.object({
    ranked_ids: z.array(z.number()).describe('Ranked offer IDs from most to least relevant, up to the requested limit'),
    markdown_explanation: z.string().describe('Markdown explanation of why these offers are the best choice for the user'),
});

async function reasonBestOffersWithAI(
    offers: FetchedOffer[],
    rawOffers: OriginalOfferData[],
    userIntent: string,
    limit: number,
    includeLinks: boolean
): Promise<{ markdown: string; rankedOffers: RankedOffer[] }> {
    if (offers.length === 0) {
        return { markdown: '', rankedOffers: [] };
    }

    const offerSummaries = offers.map(o => {
        const raw = rawOffers.find(r => r.id === o.id);
        return {
            id: o.id,
            name: o.name,
            url: o.url,
            summary: raw ? normalizeOfferForLLM(raw) : JSON.stringify(o),
        };
    });

    const linkInstruction = includeLinks
        ? 'Include a markdown hyperlink for each offer using the format [Offer Name](url).'
        : 'Do NOT include any links or URLs in the explanation.';

    const messages: ChatCompletionMessageParam[] = [
        {
            role: ChatRole.System,
            content: `You are a financial product analyst. Given the user's intent and a list of financial offers, select the top ${limit} most relevant offers and explain concisely in markdown why they are the best choices. ${linkInstruction} Respond with valid JSON only.`
        },
        {
            role: ChatRole.User,
            content: `User intent: ${userIntent || 'find the best financial product'}\n\nAvailable offers:\n${offerSummaries.map(o => `### ID: ${o.id} | ${o.name}\nURL: ${o.url}\n${o.summary}`).join('\n\n---\n\n')}\n\nSelect the top ${limit} offers and explain your reasoning.`
        }
    ];

    try {
        const raw = await getResponse({
            messages,
            schema: reasoningSchema,
            aiProvider: LLMProvider.DEEPINFRA,
            model: DeepInfraModels.LLAMA4_MAVERICK_17B,
            temperature: 0.2,
            maxTokens: 2000,
            jsonSchemaName: 'reasoning_result',
        });

        const parsed = JSON.parse(raw) as { ranked_ids: number[]; markdown_explanation: string };
        const rankedIds: number[] = (parsed.ranked_ids ?? []).slice(0, limit);

        const rankedOffers: RankedOffer[] = rankedIds
            .map(id => offers.find(o => o.id === id))
            .filter((o): o is FetchedOffer => Boolean(o))
            .map(offer => ({ offer }));

        return {
            markdown: parsed.markdown_explanation ?? '',
            rankedOffers,
        };
    } catch {
        // Graceful degradation: return simple list without AI reasoning
        const fallbackOffers = offers.slice(0, limit);
        const markdown = fallbackOffers
            .map(o => (includeLinks ? `- **[${o.name}](${o.url})**` : `- **${o.name}**`))
            .join('\n');
        return {
            markdown,
            rankedOffers: fallbackOffers.map(offer => ({ offer })),
        };
    }
}

// ---------------------------------------------------------------------------
// Built-in tool handlers
// ---------------------------------------------------------------------------

/**
 * TOOL 1 – Retrieval
 * Fetches up to `limit` (default 50) offers with the highest RPC for a given country.
 * Populates pipeline.rawOffers for downstream tools.
 */
async function toolFetchTopRpcOffers(args: Record<string, unknown>, context: StreamToolContext): Promise<unknown> {
    const code = resolveCountryCode(args.country ?? getNested(context.body, 'params.country'));
    const limit = clampNumber(args.limit, 1, 200, 50);

    const { offers } = await getSortedffersAndCategories(code);
    const top = offers.slice(0, limit);

    context.pipeline.rawOffers = offers; // keep full list available for relevance filtering
    context.pipeline.countryCode = code;

    return {
        count: top.length,
        offers: top.map(o => ({ id: o.id, name: o.name, rpc: o.rpc ?? 0, type: o.offer_type?.type ?? '' })),
    };
}

/**
 * TOOL 2 – General Intelligence
 * Uses AIModel.getRelevantOffersV2 to score offers against the user's intent,
 * then merges the relevant IDs with the top-RPC offers from Tool 1.
 * Fetches full offer details via fetchOffersByIds.
 * Populates pipeline.combinedOfferDetails.
 */
async function toolFetchRelevantOffers(args: Record<string, unknown>, context: StreamToolContext): Promise<unknown> {
    const code = context.pipeline.countryCode || resolveCountryCode(args.country ?? getNested(context.body, 'params.country'));

    // Re-use raw offers already loaded by tool 1, or fetch them now
    let rawOffers = context.pipeline.rawOffers;
    if (rawOffers.length === 0) {
        const result = await getSortedffersAndCategories(code);
        rawOffers = result.offers;
        context.pipeline.rawOffers = rawOffers;
        context.pipeline.countryCode = code;
    }

    const userIntentSummary =
        (typeof args.user_intent_summary === 'string' && args.user_intent_summary.trim()) ||
        (typeof context.body.message === 'string' && (context.body.message as string).trim()) ||
        '';

    if (!userIntentSummary) {
        // No intent – fall back to top-20 by RPC
        const top20 = rawOffers.slice(0, 20);
        const details = await fetchOffersByIds(top20.map(o => o.id), code);
        context.pipeline.combinedOfferDetails = details as FetchedOffer[];
        return details;
    }

    const explicitType = normalizeOfferType(args.type ?? args.offer_type);
    const availableTypes = explicitType
        ? [explicitType]
        : Array.from(new Set(rawOffers.map(o => normalizeOfferType(o.offer_type?.type)).filter(Boolean))) as string[];

    const idToRpc = new Map<number, number>(rawOffers.map(o => [o.id, o.rpc ?? 0]));

    const relevantByType = await Promise.all(
        availableTypes.map(type => AIModel.getRelevantOffersV2(rawOffers, userIntentSummary, type))
    );

    const relevantIds = new Set(relevantByType.flatMap(r => toNumericIds(r)));

    // Merge: AI-relevant IDs + top-20 by RPC (deduped, re-ranked by RPC)
    const topRpcIds = rawOffers.slice(0, 20).map(o => o.id);
    const combinedIds = Array.from(new Set([...relevantIds, ...topRpcIds]))
        .sort((a, b) => (idToRpc.get(b) ?? 0) - (idToRpc.get(a) ?? 0))
        .slice(0, 30);

    const details = await fetchOffersByIds(combinedIds, code);
    context.pipeline.combinedOfferDetails = details as FetchedOffer[];
    return details;
}

/**
 * TOOL 3 – Reasoning
 * Uses an LLM to select the most relevant `limit` (default 5) offers and
 * produce a markdown explanation of why they are the best choice.
 * Args:
 *   - limit: number (1–20, default 5)
 *   - include_links: boolean (default true) – whether to embed hyperlinks in markdown
 *   - user_intent_summary: string (optional override)
 * Populates pipeline.reasonedOffers.
 */
async function toolReasonBestOffers(args: Record<string, unknown>, context: StreamToolContext): Promise<unknown> {
    const limit = clampNumber(args.limit, 1, 20, 5);
    const includeLinks = args.include_links !== false;

    const offers = context.pipeline.combinedOfferDetails;
    if (offers.length === 0) {
        return { markdown: '', offers: [] };
    }

    const userIntent =
        (typeof args.user_intent_summary === 'string' && args.user_intent_summary.trim()) ||
        (typeof context.body.message === 'string' && (context.body.message as string).trim()) ||
        '';

    const { markdown, rankedOffers } = await reasonBestOffersWithAI(
        offers,
        context.pipeline.rawOffers,
        userIntent,
        limit,
        includeLinks
    );

    context.pipeline.reasonedOffers = rankedOffers;

    return {
        markdown,
        offers: rankedOffers.map(r => r.offer),
    };
}

/**
 * TOOL 4 – Format App Offers
 * Shapes the final offer list into the app_offers response format.
 * Prefers reasoned offers from Tool 3, falls back to combinedOfferDetails.
 * Args:
 *   - limit: number (1–50, default 10)
 * Populates pipeline.formattedAppOffers.
 */
async function toolFormatAppOffers(args: Record<string, unknown>, context: StreamToolContext): Promise<unknown> {
    const limit = clampNumber(args.limit, 1, 50, 10);

    const source = context.pipeline.reasonedOffers.length > 0
        ? context.pipeline.reasonedOffers.map(r => r.offer)
        : context.pipeline.combinedOfferDetails;

    const formatted: FetchedOffer[] = source.slice(0, limit).map(o => ({
        id: o.id,
        name: o.name,
        url: o.url,
        avatar: o.avatar,
        headers: o.headers,
        button_text: null,
    }));

    context.pipeline.formattedAppOffers = formatted;
    return formatted;
}

// ---------------------------------------------------------------------------
// Tool registry – add new tools here
// ---------------------------------------------------------------------------

const streamToolHandlers: Record<string, StreamToolHandler> = {
    /**
     * Retrieves up to `limit` offers with the highest RPC (revenue per click).
     * Should always be the first tool in the pipeline.
     */
    fetch_top_rpc_offers: toolFetchTopRpcOffers,

    /**
     * Finds offers most relevant to the user's intent using AI scoring,
     * then merges them with the top-RPC set for a balanced candidate list.
     */
    fetch_relevant_offers: toolFetchRelevantOffers,

    /**
     * Uses an LLM to pick the best N offers and produce a markdown explanation.
     * Set include_links=false to omit hyperlinks from the markdown output.
     */
    reason_best_offers: toolReasonBestOffers,

    /**
     * Formats the final ranked offers into the app_offers array for the frontend.
     */
    format_app_offers: toolFormatAppOffers,

    // Legacy aliases kept for backward compatibility
    fetch_top_offers: toolFetchRelevantOffers,
};


function getNested(target: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
        if (!acc || typeof acc !== 'object') {
            return undefined;
        }
        return (acc as Record<string, unknown>)[key];
    }, target);
}

function resolveCountryCode(value: unknown): string {
    if (!value && value !== 0) {
        return 'mx';
    }
    const normalized = `${value}`.toLowerCase();
    const match = countries.find(country =>
        `${country.id}` === normalized ||
        country.code.toLowerCase() === normalized ||
        country.lang.toLowerCase() === normalized
    );
    return match?.code ?? 'mx';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value === 'number') {
        return Math.min(Math.max(value, min), max);
    }
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
            return Math.min(Math.max(parsed, min), max);
        }
    }
    return fallback;
}

function parseTools(tools: unknown): StreamToolDefinition[] {
    if (!Array.isArray(tools)) {
        return [];
    }

    return tools
        .map((tool): StreamToolDefinition | null => {
            if (!tool || typeof tool !== 'object') {
                return null;
            }
            const toolObject = tool as Record<string, unknown>;
            const name = typeof toolObject.name === 'string' ? toolObject.name.trim() : '';
            if (!name) {
                return null;
            }

            return {
                name,
                description: typeof toolObject.description === 'string' ? toolObject.description : undefined,
                args: toRecord(toolObject.args)
            };
        })
        .filter((tool): tool is StreamToolDefinition => tool !== null);
}

function toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
}

function extractMessageContent(message: Record<string, unknown>): string {
    const directContent = message.content;
    if (typeof directContent === 'string') {
        return directContent;
    }

    if (Array.isArray(message.data)) {
        const firstData = message.data[0];
        if (firstData && typeof firstData === 'object') {
            const dataContent = (firstData as Record<string, unknown>).content;
            if (typeof dataContent === 'string') {
                return dataContent;
            }
            return safeStringify(dataContent);
        }
    }

    return safeStringify(directContent);
}

function normalizeIncomingMessages(messages: unknown[], userMessage: string): ChatCompletionMessageParam[] {
    const normalized: ChatCompletionMessageParam[] = [];

    for (const item of messages) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        const message = item as Record<string, unknown>;
        const rawRole = typeof message.role === 'string' ? message.role : '';
        const role = mapToChatRole(rawRole);
        const content = extractMessageContent(message);

        if (!content) {
            continue;
        }

        normalized.push({
            role,
            content
        });
    }

    const hasLatestUserMessage = normalized.some(msg => msg.role === ChatRole.User && msg.content === userMessage);
    if (!hasLatestUserMessage) {
        normalized.push({
            role: ChatRole.User,
            content: userMessage
        });
    }

    return normalized;
}

function mapToChatRole(rawRole: string): AllowedMessageRole {
    switch (rawRole?.toLowerCase?.()) {
        case ChatRole.System:
            return ChatRole.System;
        case ChatRole.Assistant:
            return ChatRole.Assistant;
        case ChatRole.User:
            return ChatRole.User;
        default:
            return ChatRole.User;
    }
}

function safeStringify(value: unknown): string {
    if (value == null) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function parseRequestedContentTypes(body: Record<string, unknown>): Set<string> {
    const candidates = [body.content_types, body.contentTypes, body.response_types, body.responseTypes];
    const contentTypes = candidates.find(Array.isArray);
    if (!Array.isArray(contentTypes)) {
        return new Set();
    }

    return new Set(
        contentTypes
            .map(type => (typeof type === 'string' ? type.toLowerCase().trim() : ''))
            .filter(Boolean)
    );
}

function resolveRequestCountryCode(body: Record<string, unknown>): string {
    const params = toRecord(body.params);
    const rawCountry = params.country ?? body.country ?? '';
    return resolveCountryCode(rawCountry);
}

function resolveRequestLanguage(body: Record<string, unknown>): string {
    const countryCode = resolveRequestCountryCode(body);
    return COUNTRY_TO_LANG[countryCode.toLowerCase()] ?? 'en';
}

function buildLanguagePolicyPrompt(language: string): string {
    if (language === 'es') {
        return [
            'LANGUAGE POLICY:',
            '- Respond in Spanish by default.',
            '- If the user explicitly asks for another language, follow that request.',
            '- Keep product names, company names, and URLs unchanged.',
        ].join('\n');
    }

    if (language === 'pl') {
        return [
            'LANGUAGE POLICY:',
            '- Respond in Polish by default.',
            '- If the user explicitly asks for another language, follow that request.',
            '- Keep product names, company names, and URLs unchanged.',
        ].join('\n');
    }

    if (language === 'sv') {
        return [
            'LANGUAGE POLICY:',
            '- Respond in Swedish by default.',
            '- If the user explicitly asks for another language, follow that request.',
            '- Keep product names, company names, and URLs unchanged.',
        ].join('\n');
    }

    return '';
}

function getNoToolsInstruction(language: string): string {
    if (language === 'es') {
        return 'En esta solicitud no se ejecutaron herramientas de recuperacion de ofertas. Proporciona orientacion financiera breve y practica, y no inventes ofertas especificas.';
    }

    if (language === 'pl') {
        return 'W tym zapytaniu nie uruchomiono narzedzi do pobierania ofert. Udziel zwięzłej, praktycznej porady finansowej i nie wymyślaj konkretnych ofert.';
    }

    if (language === 'sv') {
        return 'I denna forfragan korades inga verktyg for att hamta erbjudanden. Ge kort, praktisk finansiell vagledning och hitta inte pa specifika erbjudanden.';
    }

    return 'No product retrieval tools were run for this request. Provide concise, practical financial guidance and do not invent specific offers.';
}

/**
 * After the LLM finishes streaming, scan the combined text (LLM reply +
 * reasoning markdown) to find which offers from the candidate pool were
 * actually mentioned – by name, URL, or numeric ID.
 * Returns them in first-mention order so the card list matches the narrative.
 * Falls back to `fallback` when no meaningful matches are found.
 */
function extractMentionedOffers(
    text: string,
    candidates: FetchedOffer[],
    fallback: FetchedOffer[]
): FetchedOffer[] {
    if (!text || candidates.length === 0) {
        return fallback;
    }

    const lower = text.toLowerCase();

    type Scored = { offer: FetchedOffer; firstIndex: number };
    const matched: Scored[] = [];

    for (const offer of candidates) {
        // Exact name match (case-insensitive)
        const nameIdx = lower.indexOf(offer.name.toLowerCase());
        // URL match (partial – the domain / path is enough)
        const urlIdx = offer.url ? lower.indexOf(offer.url.toLowerCase().replace(/^https?:\/\//, '')) : -1;
        // ID mentioned as plain number, e.g. "ID: 123" or just "123"
        const idPattern = new RegExp(`\\b${offer.id}\\b`);
        const idIdx = idPattern.test(text) ? text.search(idPattern) : -1;

        const firstIndex = [nameIdx, urlIdx, idIdx].filter(i => i !== -1).reduce((min, i) => Math.min(min, i), Infinity);

        if (firstIndex !== Infinity) {
            matched.push({ offer, firstIndex });
        }
    }

    if (matched.length === 0) {
        return fallback;
    }

    return matched
        .sort((a, b) => a.firstIndex - b.firstIndex)
        .map(s => s.offer);
}

function buildAssistantData(options: {
    aggregatedText: string;
    toolOutputs: Record<string, unknown>;
    pipeline: PipelineState;
    requestedContentTypes: Set<string>;
    source: string;
}): AssistantDataItem[] {
    // Merge LLM stream text with the markdown explanation from reason_best_offers
    const reasoningOutput = options.toolOutputs.reason_best_offers;
    const reasoningMarkdown =
        reasoningOutput && typeof reasoningOutput === 'object' && !Array.isArray(reasoningOutput)
            ? String((reasoningOutput as Record<string, unknown>).markdown ?? '')
            : '';

    const fullMarkdown = [options.aggregatedText, reasoningMarkdown].filter(Boolean).join('\n\n');

    const result: AssistantDataItem[] = [
        {
            type: ContentDataType.Markdown,
            content: fullMarkdown
        }
    ];

    const wantsAppOffers = options.source === 'app' || options.requestedContentTypes.has(ContentDataType.AppOffers);

    if (wantsAppOffers) {
        // Candidate pool = everything the pipeline fetched (broadest set)
        const candidatePool: FetchedOffer[] =
            options.pipeline.combinedOfferDetails.length > 0
                ? options.pipeline.combinedOfferDetails
                : (options.pipeline.formattedAppOffers.length > 0 ? options.pipeline.formattedAppOffers : []);

        // Fallback priority: format_app_offers → reasoned → combined → legacy outputs
        const legacyOutput =
            options.toolOutputs.fetch_relevant_offers ??
            options.toolOutputs.fetch_top_offers ??
            options.toolOutputs.fetch_top_rpc_offers;

        const fallback: FetchedOffer[] = (
            Array.isArray(options.toolOutputs.format_app_offers) ? options.toolOutputs.format_app_offers :
            options.pipeline.formattedAppOffers.length > 0 ? options.pipeline.formattedAppOffers :
            Array.isArray(legacyOutput) ? legacyOutput :
            []
        ) as FetchedOffer[];

        // Derive app_offers from what the LLM actually mentioned in its text
        const offerDetails = extractMentionedOffers(fullMarkdown, candidatePool, fallback);

        if (offerDetails.length > 0) {
            result.push({
                type: ContentDataType.AppOffers,
                content: offerDetails
            });
        }
    }

    return result;
}

async function saveAssistantMessage(chatId: string | null, data: AssistantDataItem[]): Promise<void> {
    if (!chatId) {
        return;
    }

    await AIModel.saveMessageToChat(chatId, false, {
        role: ChatRole.Assistant,
        data
    });
}

// ---------------------------------------------------------------------------
// Cosmetic "thinking" steps – streamed while real tools execute
// ---------------------------------------------------------------------------

type ThinkingStepTemplates = {
    searchingData: string;
    checkingSource: (n: number) => string;
    checkingResults: string;
    comparingResults: string;
    findingBest: string;
    browsingSources: string;
};

const THINKING_STEPS_BY_LANG: Record<string, ThinkingStepTemplates> = {
    // Spanish – Mexico / Spain / Latin America
    es: {
        searchingData:     'Buscando ofertas y tasas...',
        checkingSource:    (n) => `Validando feed del proveedor ${n}...`,
        checkingResults:   'Evaluando que tan bien encajan las ofertas con tu solicitud...',
        comparingResults:  'Comparando costos, probabilidad de aprobacion y beneficios...',
        findingBest:       'Preparando tus mejores recomendaciones...',
        browsingSources:   'Contrastando condiciones y criterios de elegibilidad...',
    },
    // Polish
    pl: {
        searchingData:     'Wyszukuje oferty i stawki...',
        checkingSource:    (n) => `Weryfikuje zrodlo dostawcy ${n}...`,
        checkingResults:   'Oceniam, jak dobrze oferty pasuja do Twojego zapytania...',
        comparingResults:  'Porownuje koszty, szanse akceptacji i korzysci...',
        findingBest:       'Przygotowuje najlepsze rekomendacje...',
        browsingSources:   'Sprawdzam warunki ofert i kryteria kwalifikacji...',
    },
    // Swedish
    sv: {
        searchingData:     'Soker erbjudanden och rantesatser...',
        checkingSource:    (n) => `Verifierar leverantorsflode ${n}...`,
        checkingResults:   'Bedomer hur val erbjudanden matchar din forfragan...',
        comparingResults:  'Jamfor kostnader, sannolikhet for godkannande och fordelar...',
        findingBest:       'Tar fram dina basta rekommendationer...',
        browsingSources:   'Kontrollerar villkor och behorighetskrav...',
    },
    // English (default)
    en: {
        searchingData:     'Searching offers and rates...',
        checkingSource:    (n) => `Validating provider feed ${n}...`,
        checkingResults:   'Scoring offers against your request...',
        comparingResults:  'Comparing approval odds, costs, and benefits...',
        findingBest:       'Preparing your best-match recommendations...',
        browsingSources:   'Cross-checking terms and eligibility criteria...',
    },
};

/** Map country codes to language keys */
const COUNTRY_TO_LANG: Record<string, string> = {
    mx: 'es', es: 'es', ar: 'es', co: 'es', cl: 'es', pe: 'es', ve: 'es',
    uy: 'es', py: 'es', bo: 'es', ec: 'es', cr: 'es', gt: 'es', hn: 'es',
    sv: 'es', ni: 'es', pa: 'es', do: 'es', cu: 'es', pr: 'es',
    pl: 'pl',
    se: 'sv',
    br: 'pt', pt: 'pt',
    fr: 'fr', be: 'fr',
    de: 'de', at: 'de', ch: 'de',
    it: 'it',
};

function getThinkingSteps(countryCode: string): ThinkingStepTemplates {
    const lang = COUNTRY_TO_LANG[countryCode.toLowerCase()] ?? 'en';
    return THINKING_STEPS_BY_LANG[lang] ?? THINKING_STEPS_BY_LANG.en;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Streams randomised cosmetic thinking-step events while a real tool runs.
 * Returns a stop function – call it as soon as the real tool resolves.
 */
function startThinkingTicker(
    steps: ThinkingStepTemplates,
    sendThinkingStep: (label: string) => void,
): () => void {
    let stopped = false;

    const buildStepSequence = (): string[] => {
        const totalSources = randomInt(2, 5);
        const seq: string[] = [steps.searchingData, steps.browsingSources];

        for (let i = 1; i <= totalSources; i++) {
            seq.push(steps.checkingSource(i));
        }

        seq.push(steps.checkingResults);
        seq.push(steps.comparingResults);
        seq.push(steps.findingBest);
        return seq;
    };

    (async () => {
        const sequence = buildStepSequence();
        for (const label of sequence) {
            if (stopped) break;
            sendThinkingStep(label);
            // Random delay 180–520 ms between steps for a natural feel
            await sleep(randomInt(180, 520));
        }

        // If the real tool is still running after one full sequence, loop with filler steps
        while (!stopped) {
            const filler = [
                steps.browsingSources,
                steps.checkingSource(randomInt(1, 5)),
                steps.checkingResults,
                steps.comparingResults,
                steps.findingBest,
            ];
            for (const label of filler) {
                if (stopped) break;
                sendThinkingStep(label);
                await sleep(randomInt(250, 600));
            }
        }
    })();

    return () => { stopped = true; };
}

async function executeTools({
  toolsRequested,
  body,
  sendToolUsage,
  sendThinkingStep,
  isClientAborted,
}: {
  toolsRequested: StreamToolDefinition[];
  body: Record<string, unknown>;
  sendToolUsage: (tools: ToolUsageRecord[]) => void;
  sendThinkingStep: (label: string) => void;
  isClientAborted: () => boolean;
}): Promise<{ outputs: Record<string, unknown>; pipeline: PipelineState }> {
  if (toolsRequested.length === 0) return { outputs: {}, pipeline: createEmptyPipeline() };

  // Resolve country for localized thinking steps
    const countryCode = resolveRequestCountryCode(body);
  const thinkingSteps = getThinkingSteps(countryCode);

  const usage: ToolUsageRecord[] = toolsRequested.map(t => ({
    name: t.name,
    description: t.description,
    status: 'queued' as const,
    updatedAt: new Date().toISOString(),
  }));

  sendToolUsage(usage);

  const outputs: Record<string, unknown> = {};
  const pipeline = createEmptyPipeline();

  for (let i = 0; i < toolsRequested.length; i++) {
    if (isClientAborted()) break;

    const tool = toolsRequested[i];

    usage[i] = { ...usage[i], status: 'running', updatedAt: new Date().toISOString() };
    sendToolUsage(usage);

    // Start cosmetic thinking ticker for this tool stage
    const stopTicker = startThinkingTicker(thinkingSteps, sendThinkingStep);

    try {
      const handler = streamToolHandlers[tool.name];
      if (!handler) throw new Error(`No handler for tool: ${tool.name}`);

      const result = await handler(tool.args ?? {}, { body, pipeline });
      outputs[tool.name] = result;

      usage[i] = { ...usage[i], status: 'done', result, updatedAt: new Date().toISOString() };
    } catch (err) {
      usage[i] = {
        ...usage[i],
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        updatedAt: new Date().toISOString(),
      };
    } finally {
      stopTicker();
    }

    sendToolUsage(usage);
  }

  return { outputs, pipeline };
}


// ---------------------------------------------------------------------------
// Auto-tool execution policy
// ---------------------------------------------------------------------------

type IntentObjective =
    | 'DANGER'
    | 'LOAN'
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'BANK_ACCOUNT'
    | 'FINANCE'
    | 'OTHER';

const PRODUCT_INTENTS: Set<IntentObjective> = new Set([
    'LOAN',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_ACCOUNT',
]);

/**
 * Product-focused keywords used only as a fallback when middleware intent is
 * generic FINANCE (or unavailable) and the user still explicitly asks to find
 * cards/loans/accounts offers.
 */
const PRODUCT_REQUEST_KEYWORDS: string[] = [
    // Loans (EN/ES/PL)
    'loan', 'loans', 'borrow', 'lending', 'microloan', 'microcredit', 'payday loan', 'mortgage', 'refinance',
    'préstamo', 'préstamos', 'crédito', 'créditos',
    'pożyczka', 'pożyczki', 'chwilówka',

    // Cards (EN/ES/PL)
    'credit card', 'debit card', 'bank card',
    'tarjeta de crédito', 'tarjeta de debito', 'tarjeta',
    'karta kredytowa', 'karta debetowa',

    // Accounts (EN/ES/PL)
    'bank account', 'savings account', 'checking account', 'open account',
    'cuenta bancaria', 'abrir cuenta',
    'konto bankowe',

    // Product-intent qualifiers
    'apply for', 'best loan', 'best card', 'loan offer', 'card offer', 'compare loans', 'compare cards',
];

function parseIntentObjective(value: unknown): IntentObjective | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toUpperCase();
    const allowed: IntentObjective[] = [
        'DANGER',
        'LOAN',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'BANK_ACCOUNT',
        'FINANCE',
        'OTHER',
    ];

    return (allowed as string[]).includes(normalized) ? (normalized as IntentObjective) : null;
}

/**
 * Returns true when the latest message explicitly asks for financial products
 * (as opposed to generic finance advice like budgeting/credit education).
 */
function isProductOfferRequest(message: string): boolean {
    const lower = message.toLowerCase();
    return PRODUCT_REQUEST_KEYWORDS.some(kw => lower.includes(kw));
}

function shouldAutoRunFinanceTools(intentObjective: IntentObjective | null, userMessage: string): boolean {
    if (intentObjective && PRODUCT_INTENTS.has(intentObjective)) {
        return true;
    }

    if (intentObjective === 'FINANCE') {
        return isProductOfferRequest(userMessage);
    }

    // Defensive fallback: if middleware intent is missing, infer from text.
    if (!intentObjective) {
        return isProductOfferRequest(userMessage);
    }

    return false;
}

/**
 * Builds the default tool pipeline definition for finance requests.
 * Args are populated from the body so each tool has the context it needs.
 */
function buildDefaultFinancePipeline(body: Record<string, unknown>): StreamToolDefinition[] {
    const message = typeof body.message === 'string' ? body.message : '';
    const params = toRecord(body.params);
    const country = params.country ?? body.country;

    return [
        {
            name: 'fetch_top_rpc_offers',
            description: 'Retrieve top offers by revenue per click',
            args: { country, limit: 50 },
        },
        {
            name: 'fetch_relevant_offers',
            description: 'Filter offers relevant to the user intent via AI',
            args: { country, user_intent_summary: message },
        },
        {
            name: 'reason_best_offers',
            description: 'Select and explain the best offers in markdown',
            args: { user_intent_summary: message, limit: 5, include_links: true },
        },
        {
            name: 'format_app_offers',
            description: 'Format final offers for the app_offers response',
            args: { limit: 10 },
        },
    ];
}

// ---------------------------------------------------------------------------
// Financial assistant system prompt
// ---------------------------------------------------------------------------

const FINANCIAL_ASSISTANT_SYSTEM_PROMPT = `You are a knowledgeable financial advisor assistant. Your primary role is to help users find the best financial products — loans, credit cards, debit cards, and bank accounts.

TOOL USAGE POLICY:
- When the user asks about **loans** (personal loans, payday loans, microloans, quick cash): use tools in this order → fetch_top_rpc_offers → fetch_relevant_offers → reason_best_offers → format_app_offers
- When the user asks about **credit cards** or **bank cards**: use the same tool pipeline
- When the user asks about **bank accounts** or **savings accounts**: use the same tool pipeline

TOOL PIPELINE SUMMARY:
1. fetch_top_rpc_offers  – retrieves top offers sorted by revenue-per-click (best partner offers first)
2. fetch_relevant_offers – narrows the list using AI relevance scoring against the user's intent
3. reason_best_offers    – selects the top N offers and produces a markdown explanation
4. format_app_offers     – packages the final list for the UI

RESPONSE GUIDELINES:
– If the user wants to buy something – that's a financial topic, assist them with that.
- If the user includes some non-financial request, just ignore the non-financial part and focus on providing the best financial recommendations you can based on the tools' outputs and your knowledge.
- If the user asks a general finance question (budgeting, saving, debt management, credit score education), provide practical advice even when no product tools are used.
- If reason_best_offers produced a markdown explanation, reference or expand on it in your answer
- Highlight the key benefits of each recommended product
- Be concise, friendly, and helpful
- Always recommend verified products from the tool outputs; do not invent offers
`;

export async function streamAssistantResponse(req: InferenceRequest, res: Response) {
    const body = toRecord(req.body);
    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
    const requestLanguage = resolveRequestLanguage(body);
    const languagePolicyPrompt = buildLanguagePolicyPrompt(requestLanguage);

    if (!userMessage && incomingMessages.length === 0) {
        return res.status(400).json({ success: false, error: 'message or messages are required' });
    }

    // Respect explicit tools from request body. Otherwise auto-run the default
    // pipeline only when middleware intent indicates product selection.
    let toolsRequested = parseTools(body.tools);
    const hasExplicitTools = toolsRequested.length > 0;
    const intentObjective = parseIntentObjective(req.system?.check_safety_stream?.intent_objective);
    const autoToolsEnabled = !hasExplicitTools && shouldAutoRunFinanceTools(intentObjective, userMessage);

    console.log('Parsed tools from request:', toolsRequested.map(t => t.name));
    console.log('Tool gating decision:', {
        intent_objective: intentObjective,
        has_explicit_tools: hasExplicitTools,
        auto_tools_enabled: autoToolsEnabled,
    });

    if (autoToolsEnabled) {
        toolsRequested = buildDefaultFinancePipeline(body);
    }

    const requestedContentTypes = parseRequestedContentTypes(body);

    console.log('Final tool pipeline:', toolsRequested.map(t => t.name));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let clientAborted = false;
    req.on('close', () => {
        clientAborted = true;
    });

    const sendEvent = (eventName: string, payload: unknown) => {
        if (res.writableEnded) {
            return;
        }
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    if (req.system?.check_safety_stream) {
        sendEvent('check-safety-debug', req.system.check_safety_stream);
    }

    const { outputs: toolOutputs, pipeline } = await executeTools({
        toolsRequested,
        body,
        sendToolUsage: (tools) => sendEvent('tool-usage', { tools }),
        sendThinkingStep: (label) => sendEvent('thinking-step', { label }),
        isClientAborted: () => clientAborted
    });

    if (clientAborted) {
        res.end();
        return;
    }

    const normalizedMessages = normalizeIncomingMessages(incomingMessages, userMessage);
    const assistantSystemPrompt = languagePolicyPrompt
        ? `${FINANCIAL_ASSISTANT_SYSTEM_PROMPT}\n\n${languagePolicyPrompt}`
        : FINANCIAL_ASSISTANT_SYSTEM_PROMPT;

    const baseMessages: ChatCompletionMessageParam[] = [
        {
            role: ChatRole.System,
            content: assistantSystemPrompt
        }
    ];

    const toolEntries = Object.entries(toolOutputs);
    if (toolEntries.length > 0) {
        // Provide tool outputs as context; reason_best_offers markdown gets special treatment
        const toolContextLines = toolEntries.map(([name, output]) => {
            if (name === 'reason_best_offers' && output && typeof output === 'object' && 'markdown' in output) {
                return `${name} (reasoning):\n${(output as Record<string, unknown>).markdown}`;
            }
            return `${name}:\n${safeStringify(output)}`;
        });

        baseMessages.push({
            role: ChatRole.System,
            content: 'Tool outputs for this request:\n\n' + toolContextLines.join('\n\n---\n\n')
        });
    } else {
        baseMessages.push({
            role: ChatRole.System,
            content: getNoToolsInstruction(requestLanguage)
        });
    }

    baseMessages.push(...normalizedMessages);

    const ai = getAiProvider(LLMProvider.DEEPSEEK);
    let completion;
    try {
        completion = await ai.chat.completions.create({
            model: DeepSeekModels.CHAT,
            messages: baseMessages,
            temperature: 0.15,
            stream: true
        });
    } catch (error) {
        sendEvent('error', { message: error instanceof Error ? error.message : 'Failed to initialize stream' });
        res.end();
        return;
    }

    let aggregated = '';

    try {
        for await (const chunk of completion) {
            if (clientAborted) {
                break;
            }
            const choice = chunk.choices?.[0];
            if (!choice) {
                continue;
            }
            const deltaContent = choice.delta?.content;
            if (typeof deltaContent === 'string' && deltaContent.length > 0) {
                aggregated += deltaContent;
                sendEvent('message', { content: deltaContent });
            }
            if (choice.finish_reason === 'stop') {
                break;
            }
        }
    } catch (error) {
        sendEvent('error', { message: error instanceof Error ? error.message : 'Streaming interrupted' });
    }

    const source = typeof body.source === 'string' ? body.source.toLowerCase() : '';
    const assistantData = buildAssistantData({
        aggregatedText: aggregated,
        toolOutputs,
        pipeline,
        requestedContentTypes,
        source
    });

    const params = toRecord(body.params);
    const chatIdFromBody = typeof params.chat_id === 'string' ? params.chat_id : null;
    const chatId = chatIdFromBody || req.system?.middleware_chat_id || null;
    const checkSafetyDebug = req.system?.check_safety_stream ?? null;

    try {
        await saveAssistantMessage(chatId, assistantData);
    } catch (error) {
        sendEvent('error', { message: error instanceof Error ? error.message : 'Failed to save assistant response' });
    }

    sendEvent('message-complete', {
        success: true,
        chat_id: chatId,
        message: aggregated,
        answer: assistantData,
        check_safety_debug: checkSafetyDebug
    });
    sendEvent('done', {
        success: true,
        chat_id: chatId,
        message: aggregated,
        answer: assistantData,
        check_safety_debug: checkSafetyDebug
    });
    res.end();
}
