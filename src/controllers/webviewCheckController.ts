import { Response } from 'express';
import z from 'zod';
import { InferenceRequest } from '../types/types.js';
import { escapeFilterValue } from '../utils/common.js';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 8000;
// const WEBVIEW_BASE_URL = 'https://ai.finmatcher.com/static/offer-feed.html';
const WEBVIEW_BASE_URL = 'https://crezufin.xyz/X2zSfS6w';
const GEOIP_ENDPOINT = 'https://gw.crezu.com/geoip/';

const querySchema = z.object({
  app_name: z.string().optional(),
  app_version: z.string().optional(),
  app_build_number: z.string().optional(),
  package_name: z.string().optional(),
  platform: z.enum(['android', 'ios']).optional(),
});

const bodySchema = z.object({
  client_id: z.string().trim().min(1),
  device_info: z.string().optional(),
  appsflyer_id: z.string().nullable().optional(),
  appsflyer_attribution: z.record(z.string(), z.unknown()).nullable().optional(),
  install_referrer: z.string().nullable().optional(),
  maestra_id: z.string().nullable().optional(),
  screen_width: z.number().optional(),
  screen_height: z.number().optional(),
});

type PollResult =
  | { reason: 'appsflyer_data_available'; record: Record<string, unknown> }
  | { reason: 'timeout'; record: Record<string, unknown> | null };

async function pollForAppsflyer(
  req: InferenceRequest,
  clientId: string,
): Promise<PollResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await req.pbSuperAdmin!
      .collection('attributions')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(clientId)}"`,
      });

    const record = result.items[0] as Record<string, unknown> | undefined;
    if (record && record.appsflyer_data !== null && record.appsflyer_data !== undefined) {
      return { reason: 'appsflyer_data_available', record };
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)));
  }

  const finalResult = await req.pbSuperAdmin!
    .collection('attributions')
    .getList(1, 1, { filter: `client_id="${escapeFilterValue(clientId)}"` });

  return { reason: 'timeout', record: (finalResult.items[0] as Record<string, unknown>) ?? null };
}

async function getCountryCode(ip: string): Promise<string | null> {
  try {
    const url = new URL(GEOIP_ENDPOINT);
    url.searchParams.set('ip', ip);
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = await response.json() as { success?: boolean; iso_code?: string };
    if (!data.success || !data.iso_code) return null;
    return data.iso_code.toLowerCase();
  } catch {
    return null;
  }
}

function extractAttribStr(payload: Record<string, unknown>, key: string): string | null {
  const v = payload[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function getAttributionPayload(attribution: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!attribution) return {};
  const nested = attribution.payload;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return attribution;
}

function buildWebviewUrl(
  appsflyerId: string | null | undefined,
  maestraId: string | null | undefined,
  attribution: Record<string, unknown> | null | undefined,
  countryCode: string | null,
): string {
  const payload = getAttributionPayload(attribution);
  const campaign = extractAttribStr(payload, 'campaign');
  const adGroup = extractAttribStr(payload, 'af_adset') ?? extractAttribStr(payload, 'adset');

  const u = new URL(WEBVIEW_BASE_URL);
  if (countryCode) u.searchParams.set('country_code', countryCode);
  if (campaign) u.searchParams.set('sub4', campaign);
  if (adGroup) u.searchParams.set('sub6', adGroup);
  if (maestraId) u.searchParams.set('uuid', maestraId);
  if (appsflyerId) u.searchParams.set('afid', appsflyerId);
  return u.toString();
}

export const webviewCheck = async (req: InferenceRequest, res: Response) => {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: parsedQuery.error.issues });
  }

  const parsedBody = bodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsedBody.error.issues });
  }

  const { client_id, appsflyer_id, maestra_id, appsflyer_attribution } = parsedBody.data;

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
    ?? req.socket.remoteAddress
    ?? '';

  const countryCode = await getCountryCode(ip);
  // Country check guardrail
  // if (countryCode !== 'mx' && countryCode !== 'ph') {
  //   console.log(`webviewCheck: unsupported country (${countryCode ?? 'unknown'}) for client_id="${client_id}", returning show: false`);
  //   return res.json({ show: false });
  // }

  const { reason, record } = await pollForAppsflyer(req, client_id);

  if (reason === 'appsflyer_data_available') {
    console.log(`webviewCheck: proceeding — appsflyer_data is set for client_id="${client_id}"`, record);
  } else {
    console.log(`webviewCheck: proceeding — 8s timeout reached for client_id="${client_id}"`, record);
  }

  const url = buildWebviewUrl(appsflyer_id, maestra_id, appsflyer_attribution, countryCode);
  console.log(`webviewCheck: supported country (${countryCode}), returning webview URL for client_id="${client_id}": ${url}`);

  return res.json({
    show: true,
    url,
    wvui: 'base',
  });
};
