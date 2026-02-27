import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import z from 'zod';
import { ClientRecord, InferenceRequest } from '../types/types.js';

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
            `email="${userProfile.email}"${fallbackClientId ? ` || client_id="${fallbackClientId}"` : ''}`,
            {
              fields: ['id', 'client_id', 'email', 'name', 'city'].join(','),
            }
          );

        console.log("CLIENT", client)

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

        console.log("FALLING BACK TO CREATED CLIENT", createdClient)

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