/**
 * Auth controller for new-country registration.
 *
 * `app_auth_users` is a PocketBase **Auth collection**, so:
 *  - creation requires `password` + `passwordConfirm` (PB handles the bcrypt hash)
 *  - login uses `pb.collection(...).authWithPassword(email, password)` on a plain PB instance
 *  - password reset uses a superadmin `update({ password, passwordConfirm })`
 *
 * Custom fields on the collection: name, city, country_code, api_key (unique text).
 * Do NOT add a `password_hash` field — PocketBase owns the password.
 *
 * `recovery_codes` is a plain Base collection:
 *   user_id (text), code_hash (text), is_used (bool, default false), used_at (text/date).
 */

import { Request, Response } from 'express';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import PocketBase from 'pocketbase';
import { v4 as uuidv4 } from 'uuid';
import z from 'zod';
import { escapeFilterValue } from '../utils/common.js';
import { PbCollections, EXTERNAL_AUTH_COUNTRIES } from '../enums/enums.js';

const scryptAsync = promisify(scrypt);

// ─── Recovery-code crypto (scrypt — no external deps needed) ─────────────────

async function hashCode(code: string): Promise<string> {
    const salt = randomBytes(8).toString('hex');
    const key = await scryptAsync(code.toUpperCase(), salt, 32) as Buffer;
    return `${salt}:${key.toString('hex')}`;
}

async function verifyCode(stored: string, supplied: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const hashBuf = Buffer.from(hash, 'hex');
    const suppliedBuf = await scryptAsync(supplied.trim().toUpperCase(), salt, 32) as Buffer;
    return hashBuf.length === suppliedBuf.length && timingSafeEqual(hashBuf, suppliedBuf);
}

function generateRecoveryCodes(): string[] {
    return Array.from({ length: 10 }, () => {
        const raw = randomBytes(5).toString('hex').toUpperCase();
        return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });
}

// ─── PocketBase factory helpers ───────────────────────────────────────────────

/** Superadmin-authenticated PB — can create/read/update any record. */
async function createAdminPb(): Promise<PocketBase> {
    const pb = new PocketBase(process.env.PB_URL ?? 'https://pb.cashium.pro/');
    const auth = await pb.collection('_superusers').authWithPassword(
        process.env.PB_SUPERADMIN_USER ?? '',
        process.env.PB_SUPERUSER_ADMIN_PASSWORD ?? '',
    );
    pb.authStore.save(auth.token, auth.record);
    pb.autoCancellation(false);
    return pb;
}

/** Plain PB instance — used for `authWithPassword` (authenticates AS the user). */
function createPlainPb(): PocketBase {
    const pb = new PocketBase(process.env.PB_URL ?? 'https://pb.cashium.pro/');
    pb.autoCancellation(false);
    return pb;
}

// ─── Register ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1),
    country_code: z.string().min(2).max(3),
    city: z.string().optional(),
    client_id: z.string().optional(),
});

export async function register(req: Request, res: Response): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten() });
        return;
    }

    const { email, password, name, city, client_id } = parsed.data;
    const cc = parsed.data.country_code.toLowerCase();

    if (EXTERNAL_AUTH_COUNTRIES.has(cc)) {
        res.status(400).json({ success: false, error: `Country ${cc} uses external authentication.` });
        return;
    }

    let pb: PocketBase;
    try {
        pb = await createAdminPb();
    } catch {
        res.status(500).json({ success: false, error: 'Database connection failed.' });
        return;
    }

    // Check email uniqueness
    try {
        await pb.collection(PbCollections.APP_AUTH_USERS).getFirstListItem(
            `email="${escapeFilterValue(email.toLowerCase().trim())}"`,
        );
        res.status(409).json({ success: false, error: 'Email already registered.' });
        return;
    } catch (e: any) {
        if (e?.status !== 404) {
            res.status(500).json({ success: false, error: 'Failed to check existing user.' });
            return;
        }
    }

    const api_key = uuidv4();

    let userRecord: any;
    try {
        // PocketBase Auth collection: send `password` + `passwordConfirm` as plain strings.
        // PB handles bcrypt hashing internally. Our custom fields go in alongside them.
        userRecord = await pb.collection(PbCollections.APP_AUTH_USERS).create({
            email: email.toLowerCase().trim(),
            name,
            city: city ?? '',
            country_code: cc,
            api_key,
            password,
            passwordConfirm: password,
        });
    } catch (err: any) {
        console.error('Register create error:', err);
        const pbData = err?.response?.data ?? err?.data ?? {};
        res.status(500).json({
            success: false,
            error: 'Failed to create account.',
            details: pbData,
        });
        return;
    }

    // Generate and store 10 recovery codes
    const plainCodes = generateRecoveryCodes();
    const codeHashes = await Promise.all(plainCodes.map(hashCode));
    await Promise.all(
        codeHashes.map(code_hash =>
            pb.collection(PbCollections.RECOVERY_CODES).create({
                user_id: userRecord.id,
                code_hash,
                is_used: false,
            }).catch(err => console.error('Failed to store recovery code:', err)),
        ),
    );

    // Mirror into clients collection for compatibility with existing chat/offer logic
    const resolvedClientId = client_id ?? uuidv4();
    try {
        await pb.collection(PbCollections.CLIENTS).create({
            email: email.toLowerCase().trim(),
            client_id: resolvedClientId,
            name,
            city: city ?? '',
            password: 'defaultpassword12345678!',
            passwordConfirm: 'defaultpassword12345678!',
        });
    } catch { /* tolerate duplicate */ }

    const deepLink = `finmatcher_global://?api_key=${encodeURIComponent(api_key)}&screen=ai_chat`;

    res.status(201).json({
        success: true,
        api_key,
        recovery_codes: plainCodes,
        deep_link: deepLink,
    });
}

// ─── Login ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid input' });
        return;
    }

    const { email, password } = parsed.data;

    // Use a plain (non-admin) PB instance — authWithPassword authenticates AS the user.
    const pb = createPlainPb();
    try {
        const authData = await pb.collection(PbCollections.APP_AUTH_USERS).authWithPassword(
            email.toLowerCase().trim(),
            password,
        );

        const apiKey = authData.record['api_key'] as string;
        if (!apiKey) {
            res.status(500).json({ success: false, error: 'User record is missing api_key.' });
            return;
        }

        const deepLink = `finmatcher_global://?api_key=${encodeURIComponent(apiKey)}&screen=ai_chat`;
        res.status(200).json({ success: true, api_key: apiKey, deep_link: deepLink });
    } catch {
        res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function profile(req: Request, res: Response): Promise<void> {
    const rawKey = (req.headers['x-api-key'] as string | undefined)
        ?? (req.cookies?.uuid as string | undefined);

    if (!rawKey) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }

    const apiKey = decodeURIComponent(rawKey);

    let pb: PocketBase;
    try {
        pb = await createAdminPb();
    } catch {
        res.status(500).json({ success: false, error: 'Database connection failed.' });
        return;
    }

    try {
        const user = await pb.collection(PbCollections.APP_AUTH_USERS).getFirstListItem(
            `api_key="${escapeFilterValue(apiKey)}"`,
            { fields: 'name,email,city' },
        );
        res.status(200).json({
            name: user.name ?? '',
            email: user.email ?? '',
            city: user.city ?? null,
        });
    } catch {
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
}

// ─── Reset Password ──────────────────────────────────────────────────────────

const resetSchema = z.object({
    email: z.email(),
    recovery_code: z.string().min(1),
    new_password: z.string().min(8),
});

export async function resetPassword(req: Request, res: Response): Promise<void> {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten() });
        return;
    }

    const { email, recovery_code, new_password } = parsed.data;

    let pb: PocketBase;
    try {
        pb = await createAdminPb();
    } catch {
        res.status(500).json({ success: false, error: 'Database connection failed.' });
        return;
    }

    let userRecord: any;
    try {
        userRecord = await pb.collection(PbCollections.APP_AUTH_USERS).getFirstListItem(
            `email="${escapeFilterValue(email.toLowerCase().trim())}"`,
            { fields: 'id,api_key' },
        );
    } catch {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
    }

    let allCodes: any[];
    try {
        allCodes = await pb.collection(PbCollections.RECOVERY_CODES).getFullList({
            filter: `user_id="${escapeFilterValue(userRecord.id)}" && is_used=false`,
            fields: 'id,code_hash',
        });
    } catch {
        res.status(500).json({ success: false, error: 'Failed to fetch recovery codes.' });
        return;
    }

    let matchedId: string | null = null;
    for (const code of allCodes) {
        if (await verifyCode(code.code_hash, recovery_code)) {
            matchedId = code.id;
            break;
        }
    }

    if (!matchedId) {
        res.status(400).json({ success: false, error: 'Invalid or already used recovery code.' });
        return;
    }

    // Invalidate ALL current codes (used + unused) before issuing new ones
    await Promise.all(
        allCodes.map(c =>
            pb.collection(PbCollections.RECOVERY_CODES).update(c.id, {
                is_used: true,
                used_at: new Date().toISOString(),
            }).catch(() => {}),
        ),
    );

    // Update password via superadmin — PB re-hashes internally, no oldPassword required
    try {
        await pb.collection(PbCollections.APP_AUTH_USERS).update(userRecord.id, {
            password: new_password,
            passwordConfirm: new_password,
        });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({ success: false, error: 'Failed to update password.' });
        return;
    }

    // Issue a fresh set of 10 recovery codes
    const newPlainCodes = generateRecoveryCodes();
    const newHashes = await Promise.all(newPlainCodes.map(hashCode));
    await Promise.all(
        newHashes.map(code_hash =>
            pb.collection(PbCollections.RECOVERY_CODES).create({
                user_id: userRecord.id,
                code_hash,
                is_used: false,
            }).catch(err => console.error('Failed to store new recovery code:', err)),
        ),
    );

    res.status(200).json({ success: true, recovery_codes: newPlainCodes });
}

// ─── Internal helper used by clientIdController ───────────────────────────────

export async function lookupUserByApiKey(
    pb: PocketBase,
    apiKey: string,
): Promise<{ email: string; name: string; city: string } | null> {
    try {
        const user = await pb.collection(PbCollections.APP_AUTH_USERS).getFirstListItem(
            `api_key="${escapeFilterValue(decodeURIComponent(apiKey))}"`,
            { fields: 'email,name,city' },
        );
        return { email: user.email, name: user.name ?? '', city: user.city ?? '' };
    } catch {
        return null;
    }
}
