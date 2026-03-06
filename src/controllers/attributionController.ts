import type { Response } from 'express';
import z from 'zod';
import { InferenceRequest } from '../types/types.js';

const attributionSchema = z.object({
  client_id: z.string().trim().min(1),
  appsflyer_data: z.unknown().nullable().optional(),
  install_referrer: z.string().trim().nullable().optional(),
  appsflyer_id: z.string().trim().nullable().optional(),
});

const escapeFilterValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return false;
};

export const saveAttribution = async (req: InferenceRequest, res: Response) => {
  const parsedAttribution = attributionSchema.safeParse({
    client_id: req.body?.client_id ?? req.body?.params?.client_id,
    appsflyer_data: req.body?.appsflyer ?? null,
    install_referrer: req.body?.install_referrer ?? null,
    appsflyer_id: req.body?.appsflyer_id ?? null,
  });

  if (!parsedAttribution.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid attribution payload',
      details: parsedAttribution.error.issues,
    });
  }

  const { client_id, appsflyer_data, install_referrer, appsflyer_id } = parsedAttribution.data;

  try {
    const existingAttribution = await req.pbSuperAdmin!
      .collection('attributions')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(client_id)}"`,
        fields: 'id,client_id,appsflyer_data,install_referrer,appsflyer_id',
      });

    if (existingAttribution.totalItems > 0) {
      const existingRecord = existingAttribution.items[0] as {
        id: string;
        appsflyer_data?: unknown;
        install_referrer?: string | null;
        appsflyer_id?: string | null;
      };

      const updatePayload: {
        appsflyer_data?: unknown;
        install_referrer?: string;
        appsflyer_id?: string;
      } = {};

      if (isEmptyValue(existingRecord.appsflyer_data) && !isEmptyValue(appsflyer_data)) {
        updatePayload.appsflyer_data = appsflyer_data;
      }

      if (isEmptyValue(existingRecord.install_referrer) && !isEmptyValue(install_referrer)) {
        updatePayload.install_referrer = install_referrer!;
      }

      if (isEmptyValue(existingRecord.appsflyer_id) && !isEmptyValue(appsflyer_id)) {
        updatePayload.appsflyer_id = appsflyer_id!;
      }

      if (Object.keys(updatePayload).length > 0) {
        await req.pbSuperAdmin!.collection('attributions').update(existingRecord.id, updatePayload);

        return res.status(200).json({
          success: true,
          created: false,
          updated: true,
          message: 'Attribution updated with missing fields',
        });
      }

      return res.status(200).json({
        success: true,
        created: false,
        updated: false,
        message: 'Attribution already exists and has no empty fields',
      });
    }

    await req.pbSuperAdmin!.collection('attributions').create({
      client_id,
      appsflyer_data,
      install_referrer,
      appsflyer_id,
    });

    return res.status(200).json({
      success: true,
      created: true,
      message: 'Attribution saved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to save attribution data',
      details: (error as Error).message,
    });
  }
};