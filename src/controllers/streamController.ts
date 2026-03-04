import { Response } from 'express';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { ChatRole, ContentDataType, DeepInfraModels, LLMProvider } from '../enums/enums.js';
import { fetchOffersByIds, getSortedffersAndCategories, countries } from '../utils/common.js';
import { AIModel, getAiProvider } from '../models/AiModel.js';
import { InferenceRequest } from '../types/types.js';

type ToolStatus = 'queued' | 'running' | 'done' | 'error';
type AllowedMessageRole = 'system' | 'assistant' | 'user';

type StreamToolDefinition = {
    name: string;
    description?: string;
    args?: Record<string, unknown>;
};

type StreamToolHandler = (args: Record<string, unknown>, context: { body: Record<string, unknown> }) => Promise<unknown>;

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

async function fetchRelevantOffersForStream(args: Record<string, unknown>, context: { body: Record<string, unknown> }) {
    const code = resolveCountryCode(args.country ?? getNested(context.body, 'params.country'));
    const limit = clampNumber(args.limit, 1, 10, 3);
    const { offers } = await getSortedffersAndCategories(code);

    const userIntentSummary =
        (typeof args.user_intent_summary === 'string' && args.user_intent_summary.trim()) ||
        (typeof context.body.message === 'string' && context.body.message.trim()) ||
        '';

    if (!userIntentSummary) {
        return [];
    }

    const explicitType = normalizeOfferType(args.type ?? args.offer_type ?? args.intent_type);
    const availableTypes = Array.from(new Set(
        offers
            .map(offer => normalizeOfferType(offer.offer_type?.type))
            .filter((type): type is string => Boolean(type))
    ));

    const candidateTypes = explicitType ? [explicitType] : availableTypes;
    if (candidateTypes.length === 0) {
        return [];
    }

    const idToRpc = new Map<number, number>();
    offers.forEach(offer => {
        idToRpc.set(offer.id, offer.rpc ?? 0);
    });

    const relevantByType = await Promise.all(
        candidateTypes.map(type => AIModel.getRelevantOffersV2(offers, userIntentSummary, type))
    );

    const mergedIds = Array.from(new Set(relevantByType.flatMap(result => toNumericIds(result))));
    const rankedIds = mergedIds
        .sort((a, b) => (idToRpc.get(b) ?? 0) - (idToRpc.get(a) ?? 0))
        .slice(0, limit);

    if (rankedIds.length === 0) {
        return [];
    }

    return fetchOffersByIds(rankedIds, code);
}

const streamToolHandlers: Record<string, StreamToolHandler> = {
    fetch_top_offers: async (args, context) => fetchRelevantOffersForStream(args, context),
    fetch_relevant_offers: async (args, context) => fetchRelevantOffersForStream(args, context),
};

export function registerStreamTool(name: string, handler: StreamToolHandler): void {
    const normalizedName = name.trim();
    if (!normalizedName) {
        throw new Error('Tool name is required');
    }
    streamToolHandlers[normalizedName] = handler;
}

export function listStreamTools(): string[] {
    return Object.keys(streamToolHandlers);
}

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

function buildAssistantData(options: {
    aggregatedText: string;
    toolOutputs: Record<string, unknown>;
    requestedContentTypes: Set<string>;
    source: string;
}): AssistantDataItem[] {
    const result: AssistantDataItem[] = [
        {
            type: ContentDataType.Markdown,
            content: options.aggregatedText
        }
    ];

    const details = options.toolOutputs.fetch_offer_details;
    const topOffers = options.toolOutputs.fetch_top_offers;
    const relevantOffers = options.toolOutputs.fetch_relevant_offers;

    const offerDetails = Array.isArray(details)
        ? details
        : Array.isArray(relevantOffers)
            ? relevantOffers
            : Array.isArray(topOffers)
                ? topOffers
                : [];
    const wantsAppOffers = options.source === 'app' || options.requestedContentTypes.has(ContentDataType.AppOffers);

    if (wantsAppOffers && offerDetails.length > 0) {
        result.push({
            type: ContentDataType.AppOffers,
            content: offerDetails
        });
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

async function executeTools({
  toolsRequested,
  body,
  sendToolUsage,
  isClientAborted,
}: {
  toolsRequested: StreamToolDefinition[];
  body: Record<string, unknown>;
  sendToolUsage: (tools: ToolUsageRecord[]) => void;
  isClientAborted: () => boolean;
}): Promise<Record<string, unknown>> {
  if (toolsRequested.length === 0) return {};

  const usage: ToolUsageRecord[] = toolsRequested.map(t => ({
    name: t.name,
    description: t.description,
    status: 'queued' as const,
    updatedAt: new Date().toISOString(),
  }));

  sendToolUsage(usage);

  const outputs: Record<string, unknown> = {};

  for (let i = 0; i < toolsRequested.length; i++) {
    if (isClientAborted()) break;

    const tool = toolsRequested[i];

    usage[i] = { ...usage[i], status: 'running', updatedAt: new Date().toISOString() };
    sendToolUsage(usage);

    try {
      const handler = streamToolHandlers[tool.name];
      if (!handler) throw new Error(`No handler for tool: ${tool.name}`);

      const result = await handler(tool.args ?? {}, { body });
      outputs[tool.name] = result;

      usage[i] = { ...usage[i], status: 'done', result, updatedAt: new Date().toISOString() };
    } catch (err) {
      usage[i] = {
        ...usage[i],
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        updatedAt: new Date().toISOString(),
      };
    }

    sendToolUsage(usage);
  }

  return outputs;
}


export async function streamAssistantResponse(req: InferenceRequest, res: Response) {
    const body = toRecord(req.body);
    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

    if (!userMessage && incomingMessages.length === 0) {
        return res.status(400).json({ success: false, error: 'message or messages are required' });
    }

    const toolsRequested = parseTools(body.tools);
    const requestedContentTypes = parseRequestedContentTypes(body);

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

    const toolOutputs = await executeTools({
        toolsRequested,
        body,
        sendToolUsage: (tools) => sendEvent('tool-usage', { tools }),
        isClientAborted: () => clientAborted
    });

    if (clientAborted) {
        res.end();
        return;
    }

    const normalizedMessages = normalizeIncomingMessages(incomingMessages, userMessage);
    const baseMessages: ChatCompletionMessageParam[] = [
        {
            role: ChatRole.System,
            content: 'You are a streaming-focused assistant. Send partial answers as soon as they are available.'
        }
    ];

    const toolEntries = Object.entries(toolOutputs);
    if (toolEntries.length > 0) {
        baseMessages.push({
            role: ChatRole.System,
            content: 'Tool outputs:\n' + toolEntries.map(([name, output]) => `${name}: ${safeStringify(output)}`).join('\n\n')
        });
    }

    baseMessages.push(...normalizedMessages);

    const ai = getAiProvider(LLMProvider.DEEPINFRA);
    let completion;
    try {
        completion = await ai.chat.completions.create({
            model: DeepInfraModels.LLAMA4_MAVERICK_17B,
            messages: baseMessages,
            temperature: 0.25,
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
        requestedContentTypes,
        source
    });

    const params = toRecord(body.params);
    const chatIdFromBody = typeof params.chat_id === 'string' ? params.chat_id : null;
    const chatId = chatIdFromBody || req.system?.middleware_chat_id || null;

    try {
        await saveAssistantMessage(chatId, assistantData);
    } catch (error) {
        sendEvent('error', { message: error instanceof Error ? error.message : 'Failed to save assistant response' });
    }

    sendEvent('message-complete', {
        content: aggregated,
        data: assistantData
    });
    sendEvent('done', {
        success: true,
        chat_id: chatId,
        data: assistantData
    });
    res.end();
}
