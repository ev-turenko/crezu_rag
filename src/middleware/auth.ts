
import type { Request, Response, NextFunction } from 'express';
import PocketBase from 'pocketbase';

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

export function initPbInstance(pbUrl: string): any {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        console.log('Handling request to:', req.originalUrl);
        req.pb = new PocketBase(pbUrl);
        req.pbSuperAdmin = new PocketBase(pbUrl);
        const pbSuperAdminAuthenticated = await req.pbSuperAdmin.collection('_superusers').authWithPassword(
            process.env.PB_SUPERADMIN_USERNAME || '',
            process.env.PB_SUPERADMIN_PASSWORD || ''
        );
        req.pbSuperAdmin.authStore.save(pbSuperAdminAuthenticated.token, pbSuperAdminAuthenticated.record);
        req.pbSuperAdmin.autoCancellation(false)

        if(!req.pb || !req.pbSuperAdmin) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize database instance'
            });
        }

        next();
    }
}

export function authenticateToken() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            let token = req.cookies?.auth_token || req.headers['authorization']?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            req.pb!.authStore.save(token, null);

            await req.pb!.collection('users').authRefresh();

            if (!req.pb!.authStore.isValid || !req.pb!.authStore.record) {
                console.log('Invalid or expired token');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }


            if (req.pb!.authStore.record.verified === false) {
                return res.status(403).json({
                    success: false,
                    message: 'User is not verified'
                });
            }

            req.user = req.pb!.authStore.record;
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed',
                error
            });
        }
    }
}