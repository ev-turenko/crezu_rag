import type { Response } from 'express';
import z from 'zod';
import { InferenceRequest } from '../types/types.js';

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const escapeFilterValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const daysRemaining = (trialEndTimestamp: number): number =>
  Math.max(0, Math.ceil((trialEndTimestamp - Date.now()) / 86_400_000));

const clientIdQuerySchema = z.object({
  client_id: z.string().trim().min(1, 'client_id is required'),
});

const acceptTrialSchema = z.object({
  client_id: z.string().trim().min(1, 'client_id is required'),
  accept_trial: z.literal(true),
});

export const getTrialStatus = async (req: InferenceRequest, res: Response) => {
  const parsed = clientIdQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: parsed.error.issues,
    });
  }

  const { client_id } = parsed.data;

  try {
    const result = await req.pbSuperAdmin!
      .collection('app_trials')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(client_id)}"`,
        fields: 'id,client_id,trial_end_timestamp,is_claimed,trial_claim_timestamp',
      });

    if (result.totalItems === 0) {
      return res.status(200).json({ has_trial: false });
    }

    const record = result.items[0] as unknown as {
      id: string;
      client_id: string;
      trial_end_timestamp: number;
      is_claimed: boolean;
      trial_claim_timestamp: number;
    };

    return res.status(200).json({
      has_trial: true,
      is_claimed: record.is_claimed,
      trial_end_timestamp: record.trial_end_timestamp,
      trial_claim_timestamp: record.trial_claim_timestamp,
      is_active: record.trial_end_timestamp > Date.now(),
      days_remaining: daysRemaining(record.trial_end_timestamp),
    });
  } catch (error) {
    console.error('Error fetching trial status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const checkTrialEligibility = async (req: InferenceRequest, res: Response) => {
  const parsed = clientIdQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: parsed.error.issues,
    });
  }

  const { client_id } = parsed.data;

  try {
    const result = await req.pbSuperAdmin!
      .collection('app_trials')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(client_id)}"`,
        fields: 'id',
      });

    return res.status(200).json({
      eligible: result.totalItems === 0,
      trial_duration_days: TRIAL_DURATION_MS / 86_400_000,
    });
  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const acceptTrial = async (req: InferenceRequest, res: Response) => {
  const parsed = acceptTrialSchema.safeParse({
    client_id: req.body?.client_id,
    accept_trial: req.body?.accept_trial,
  });

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
      details: parsed.error.issues,
    });
  }

  const { client_id } = parsed.data;

  try {
    const existing = await req.pbSuperAdmin!
      .collection('app_trials')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(client_id)}"`,
        fields: 'id',
      });

    if (existing.totalItems > 0) {
      return res.status(409).json({
        success: false,
        error: 'Trial already exists for this client',
      });
    }

    const now = Date.now();
    const trial_end_timestamp = now + TRIAL_DURATION_MS;

    await req.pbSuperAdmin!.collection('app_trials').create({
      client_id,
      is_claimed: true,
      trial_claim_timestamp: now,
      trial_end_timestamp,
    });

    return res.status(200).json({
      success: true,
      trial_end_timestamp,
      days_remaining: 7,
    });
  } catch (error) {
    console.error('Error accepting trial:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
