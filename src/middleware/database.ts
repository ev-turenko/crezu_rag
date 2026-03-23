import { NextFunction, Response } from "express";
import PocketBase, { RecordModel } from 'pocketbase';
import { ClientRecord, InferenceRequest } from "../types/types.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import z from "zod";
import { escapeFilterValue } from "../utils/common.js";

dotenv.config();



export function initPbInstance(pbUrl: string): any {
  return async (req: InferenceRequest, res: Response, next: NextFunction) => {
    req.pb = new PocketBase(pbUrl);
    req.pbSuperAdmin = new PocketBase(pbUrl);
    const pbSuperAdminAuthenticated = await req.pbSuperAdmin.collection('_superusers').authWithPassword(
      process.env.PB_SUPERADMIN_USER || '',
      process.env.PB_SUPERUSER_ADMIN_PASSWORD || ''
    );

    req.pbSuperAdmin.authStore.save(pbSuperAdminAuthenticated.token, pbSuperAdminAuthenticated.record);
    req.pbSuperAdmin.autoCancellation(false)
    console.log('PocketBase instance initialized for request to:', req.originalUrl);


    next();
  }
}





async function migrateTrialChats(
  trialClientId: string,
  registeredClientId: string,
  req: InferenceRequest,
): Promise<void> {
  try {
    const chats = await req.pbSuperAdmin!
      .collection('chats')
      .getFullList({
        filter: `client_id="${escapeFilterValue(trialClientId)}" && is_trial_chat=true`,
        fields: 'id',
      });

    if (chats.length === 0) return;

    await Promise.all(
      chats.map((chat) =>
        req.pbSuperAdmin!.collection('chats').update(chat.id, { client_id: registeredClientId }),
      ),
    );

    console.log(`Migrated ${chats.length} trial chat(s) from client_id="${trialClientId}" → "${registeredClientId}"`);
  } catch (error) {
    console.error('migrateTrialChats error (non-fatal):', error);
  }
}

async function endActiveTrialIfExists(clientId: string, pbSuperAdmin: PocketBase): Promise<void> {
  try {
    const result = await pbSuperAdmin
      .collection('app_trials')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(clientId)}" && is_claimed=true`,
        fields: 'id,trial_end_timestamp',
      });

    if (result.totalItems > 0) {
      const trial = result.items[0] as unknown as { id: string; trial_end_timestamp: number };
      if (trial.trial_end_timestamp > Date.now()) {
        await pbSuperAdmin.collection('app_trials').update(trial.id, {
          trial_end_timestamp: Date.now(),
        });
        console.log(`Ended active trial for registered client_id="${clientId}"`);
      }
    }
  } catch (error) {
    console.error('endActiveTrialIfExists error (non-fatal):', error);
  }
}

const finmatcherProfileSchema = z.object({
  email: z.email(),
  name: z.string(),
  city: z.string().nullable(),
});

async function resolveRegisteredUser(
  uuid: string,
  clientId: string,
  req: InferenceRequest,
): Promise<boolean> {
  try {
    const response = await fetch('https://finmatcher.com/api/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': encodeURIComponent(uuid),
      },
    });
    const responseJson = await response.json();
    const parsed = finmatcherProfileSchema.safeParse(responseJson);

    if (!parsed.success) {
      return false;
    }

    const userProfile = parsed.data;

    try {
      const client = await req.pbSuperAdmin!
        .collection('clients')
        .getFirstListItem<ClientRecord>(
          `email="${escapeFilterValue(userProfile.email)}" || client_id="${escapeFilterValue(clientId)}"`,
          { fields: 'id,client_id,email,name,city' },
        );

      req.userProfile = {
        id: client.id,
        client_id: client.client_id || '',
        email: client.email || null,
        name: client.name || '',
        city: client.city || null,
        is_trial: false,
      };

      // Migrate trial chats when the URL client_id differs from the registered one
      if (clientId && client.client_id && client.client_id !== clientId) {
        await migrateTrialChats(clientId, client.client_id, req);
      }

      return true;
    } catch {
      // Client record not yet created — create it and still allow access
      try {
        await req.pbSuperAdmin!.collection('clients').create({
          email: userProfile.email,
          client_id: clientId || uuidv4(),
          password: 'defaultpassword12345678!',
          passwordConfirm: 'defaultpassword12345678!',
        });
      } catch { /* ignore duplicate create race */ }
      req.userProfile = {
        client_id: clientId || '',
        email: userProfile.email,
        name: userProfile.name,
        city: userProfile.city,
        is_trial: false,
      };
      return true;
    }
  } catch {
    return false;
  }
}

async function checkActiveTrial(
  clientId: string,
  req: InferenceRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  console.log('Checking active trial for client_id:', clientId);
  if (!clientId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const result = await req.pbSuperAdmin!
      .collection('app_trials')
      .getList(1, 1, {
        filter: `client_id="${escapeFilterValue(clientId)}"`,
        fields: 'id,trial_end_timestamp,is_claimed',
      });

    if (result.totalItems === 0) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const trial = result.items[0] as unknown as {
      trial_end_timestamp: number;
      is_claimed: boolean;
    };

    if (!trial.is_claimed || trial.trial_end_timestamp <= Date.now()) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    req.userProfile = { client_id: clientId, is_trial: true };
    next();
  } catch (error) {
    console.error('checkActiveTrial error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export function checkChatsAuth() {
  return async (req: InferenceRequest, res: Response, next: NextFunction) => {
    const clientId = req.params?.client_id || '';

    // 1. Check whether a registered client with this client_id exists
    let clientRecord: ClientRecord | null = null;
    try {
      clientRecord = await req.pbSuperAdmin!
        .collection('clients')
        .getFirstListItem<ClientRecord>(
          `client_id="${escapeFilterValue(clientId)}"`,
          { fields: 'id,client_id,email,name,city' },
        );
    } catch {
      // No client record found
    }

    if (!clientRecord) {
      // No registered client — fall back to trial check
      return checkActiveTrial(clientId, req, res, next);
    }

    // End any active trial now that this client_id is confirmed as registered
    await endActiveTrialIfExists(clientId, req.pbSuperAdmin!);

    // 2. Client exists — uuid cookie is required
    const uuid = req.cookies?.uuid as string | undefined;
    if (!uuid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // 3. Validate the uuid against the external auth service
    const isValid = await resolveRegisteredUser(uuid, clientId, req);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    return next();
  };
}

export function getUserEntry() {
  return async (req: InferenceRequest, res: Response, next: NextFunction) => {
    let uuid = req.cookies?.uuid as string | undefined;
    // here handle also the case when client id is provided as :client_id in url
    const clientId = req.params?.client_id || req.body?.params?.client_id || req.params?.client_id;

    if (!uuid) {
      uuid = uuidv4();
    }

    let userProfile: ClientRecord | any = null;

    let isUserProfileValid = false

    if (req.cookies?.uuid) {
      const request = await fetch('https://finmatcher.com/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': encodeURIComponent(uuid),
        }
      })
      const responseJson = await request.json();

      const profileSchema = z.object({
        email: z.email(),
        name: z.string(),
        city: z.string().nullable()
      });

      isUserProfileValid = profileSchema.safeParse(responseJson).success;

      console.log("USER PROFILE VALID:", isUserProfileValid, responseJson)

      if (isUserProfileValid) {
        userProfile = responseJson;

        try {
          let client = await req.pbSuperAdmin!
            .collection('clients')
            .getFirstListItem<ClientRecord>(`email="${userProfile.email}" || client_id="${clientId}"`, {
              fields: [
                'id',
                'client_id',
                'email',
                'name',
                'city'
              ].join(','),
            });

          req.userProfile = {
            id: client.id,
            client_id: client.client_id || '',
            email: client.email || null,
            name: client.name || '',
            city: client.city || null,
          };

          next();


        } catch (error) {
          console.log("LEER", error)
          try {
            await req.pbSuperAdmin!.collection('clients').create({
              email: userProfile?.email || `unknown_${Date.now()}@example.com`,
              client_id: clientId || uuidv4(),
              password: 'defaultpassword12345678!',
              passwordConfirm: 'defaultpassword12345678!'
            });
          } catch (error) {

          }
        }
      } else {
        console.log("EMPTY 1")
      }
    } else {
      req.userProfile = {
        client_id: clientId || '',
      };
      next();
    }


  }
}