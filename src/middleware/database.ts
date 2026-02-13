import { NextFunction, Response } from "express";
import PocketBase, { RecordModel } from 'pocketbase';
import { ClientRecord, InferenceRequest } from "../types/types.js";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import z from "zod";

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





export function getUserEntry() {
  return async (req: InferenceRequest, res: Response, next: NextFunction) => {
    let uuid = req.cookies?.uuid as string | undefined;
    const clientId = req.params?.client_id || req.body?.params?.client_id;

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

      }
    } else {
      next();
    }

    
  }
}