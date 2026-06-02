import { Response } from 'express';
import z from 'zod';
import { InferenceRequest } from '../types/types.js';
import { escapeFilterValue } from '../utils/common.js';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 8000;

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

async function pollForAppsflyer(
  req: InferenceRequest,
  clientId: string,
): Promise<'appsflyer_data_available' | 'timeout'> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await req.pbSuperAdmin!
      .collection('attributions')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(clientId)}"`,
        fields: 'appsflyer_data',
      });

    const record = result.items[0] as { appsflyer_data?: unknown } | undefined;
    if (record && record.appsflyer_data !== null && record.appsflyer_data !== undefined) {
      return 'appsflyer_data_available';
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)));
  }

  return 'timeout';
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

  const { client_id } = parsedBody.data;

  const reason = await pollForAppsflyer(req, client_id);

  if (reason === 'appsflyer_data_available') {
    console.log(`webviewCheck: proceeding — appsflyer_data is set for client_id="${client_id}"`);
  } else {
    console.log(`webviewCheck: proceeding — 8s timeout reached, appsflyer_data still null for client_id="${client_id}"`);
  }

  return res.json({
    show: false,
    url: 'ai.finmatcher.com',
    wvui: 'decorated',
  });
};
