
import type { Request, Response, NextFunction } from 'express';
import PocketBase from 'pocketbase';
import { InferenceRequest } from '../types.js';
import { MessageFormat, TextFormat } from '../enums/enums.js';

export interface AuthenticatedRequest extends Request {
    user?: any;
    pb?: PocketBase;
    pbSuperAdmin?: PocketBase;
}

export interface PbUser {
    id: string;
    email: string;
    verified: boolean;
    collectionName: string;
    role: string;
    [key: string]: any;
}

export function initDefaults(): any {
    return async (req: InferenceRequest, _: Response, next: NextFunction) => {
        req.f_country_id = req.body?.country_id ? isNaN(parseInt(req.body.country_id)) ? 2 : parseInt(req.body.country_id) : 2;
        req.f_message = req.body?.message || '';
        req.f_message_format = req.body?.message_format || MessageFormat.TEXT;
        req.f_text_format = req.body?.text_format || TextFormat.MARKDOWN;
        req.f_messages = req.body?.messages || [];
        next();
    }
}

