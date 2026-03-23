import { Request, Response } from 'express';
import PocketBase from 'pocketbase';
import { PbCollections } from '../enums/enums.js';

function sanitizePbFilter(value: string): string {
    // Escape backslashes then double quotes to prevent PocketBase filter injection
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function requestAccountDeletion() {
    return async (req: Request, res: Response) => {
        const { email, reason } = req.body as { email?: string; reason?: string };

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ success: false, error: 'Email is required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ success: false, error: 'Invalid email address.' });
        }

        const trimmedReason = reason?.trim() ?? '';

        const pb = new PocketBase(process.env.PB_URL ?? 'https://pb.cashium.pro/');
        pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);

        try {
            let emailFoundInClients = false;

            try {
                await pb.collection(PbCollections.CLIENTS).getFirstListItem(
                    `email="${sanitizePbFilter(trimmedEmail)}"`
                );
                emailFoundInClients = true;
            } catch (lookupError: any) {
                if (lookupError?.status !== 404) {
                    console.error('Error looking up client by email:', lookupError);
                }
                // 404 means not found — handled below
            }

            await pb.collection(PbCollections.DELETION_REQUESTS).create({
                email: trimmedEmail,
                reason: trimmedReason,
                email_found: emailFoundInClients,
            });

            if (emailFoundInClients) {
                return res.status(200).json({
                    success: true,
                    message:
                        'Deletion requested successfully. Your data will be deleted within 48 hours. ' +
                        'You may need to confirm that you are the owner of the provided email with a verification code.',
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message:
                        'Deletion requested successfully. However, we were not able to find any relations of this email ' +
                        'with our app database. We will still check the information project-wide and delete any data we find. ' +
                        'You may need to prove your ownership of this email via a one-time code.',
                });
            }
        } catch (error: any) {
            console.error('Error processing account deletion request:', error);
            return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
        }
    };
}
