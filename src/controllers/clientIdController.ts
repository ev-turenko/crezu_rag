import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import z from 'zod';
import { ClientRecord, InferenceRequest } from '../types/types.js';
import { escapeFilterValue } from '../utils/common.js';
import { lookupUserByApiKey } from './authController.js';

const profileSchema = z.object({
  email: z.email(),
  name: z.string(),
  city: z.string().nullable(),
});

export function getClientIdByCookieUuid() {
  return async (req: InferenceRequest, res: Response) => {
    const uuid = req.cookies?.uuid as string | undefined;
    const fallbackClientId =
      (req.query?.client_id as string | undefined) ||
      req.params?.client_id ||
      req.body?.params?.client_id;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'uuid cookie is required',
      });
    }

    // ── 1. Try our own PocketBase (new-country users) ────────────────────────
    try {
      const ownUser = await lookupUserByApiKey(req.pbSuperAdmin!, uuid);
      if (ownUser) {
        // Resolve or create a clients record for this email
        try {
          const client = await req.pbSuperAdmin!
            .collection('clients')
            .getFirstListItem<ClientRecord>(
              `email="${escapeFilterValue(ownUser.email)}"${fallbackClientId ? ` || client_id="${escapeFilterValue(fallbackClientId)}"` : ''}`,
              { fields: ['id', 'client_id', 'email'].join(',') },
            );
          return res.status(200).json({ success: true, client_id: client.client_id || '' });
        } catch {
          const newClientId = fallbackClientId || uuidv4();
          await req.pbSuperAdmin!.collection('clients').create({
            email: ownUser.email,
            client_id: newClientId,
            name: ownUser.name,
            city: ownUser.city,
            password: 'defaultpassword12345678!',
            passwordConfirm: 'defaultpassword12345678!',
          });
          return res.status(200).json({ success: true, client_id: newClientId });
        }
      }
    } catch {
      // pbSuperAdmin not available or lookup failed — fall through
    }

    // ── 2. Fall back to finmatcher.com (original countries) ─────────────────
    try {
      const profileResponse = await fetch('https://finmatcher.com/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': encodeURIComponent(uuid),
        },
      });

      if (!profileResponse.ok) {
        return res.status(404).json({
          success: false,
          error: 'Unable to resolve profile by uuid',
        });
      }

      const responseJson: unknown = await profileResponse.json();
      const parsedProfile = profileSchema.safeParse(responseJson);

      if (!parsedProfile.success) {
        return res.status(404).json({
          success: false,
          error: 'Profile was not found or invalid',
        });
      }

      const userProfile = parsedProfile.data;

      try {
        const client = await req.pbSuperAdmin!
          .collection('clients')
          .getFirstListItem<ClientRecord>(
            `email="${escapeFilterValue(userProfile.email)}"${fallbackClientId ? ` || client_id="${escapeFilterValue(fallbackClientId)}"` : ''}`,
            {
              fields: ['id', 'client_id', 'email', 'name', 'city'].join(','),
            }
          );

        return res.status(200).json({
          success: true,
          client_id: client.client_id || '',
        });
      } catch {
        const createdClient = await req.pbSuperAdmin!.collection('clients').create({
          email: userProfile.email,
          client_id: fallbackClientId || uuidv4(),
          password: 'defaultpassword12345678!',
          passwordConfirm: 'defaultpassword12345678!',
        });

        return res.status(200).json({
          success: true,
          client_id: createdClient.client_id || fallbackClientId || '',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve client_id by uuid',
        details: (error as Error).message,
      });
    }
  };
}
