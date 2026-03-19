import PocketBase from 'pocketbase';
import type { Request, Response } from 'express';

export async function reportOffer(req: Request, res: Response) {
    const offerId = `${req.body?.offer_id ?? req.body?.params?.offer_id ?? ''}`.trim();
    const description = `${req.body?.description ?? req.body?.params?.description ?? ''}`.trim();
    const clientId = `${req.body?.client_id ?? req.body?.params?.client_id ?? ''}`.trim();
    const chatId = `${req.body?.chat_id ?? req.body?.params?.chat_id ?? ''}`.trim();

    if (!offerId) {
        return res.status(400).json({
            success: false,
            error: 'offer_id is required',
        });
    }

    if (!description) {
        return res.status(400).json({
            success: false,
            error: 'description is required',
        });
    }

    if (!clientId) {
        return res.status(400).json({
            success: false,
            error: 'client_id is required',
        });
    }

    if (!chatId) {
        return res.status(400).json({
            success: false,
            error: 'chat_id is required',
        });
    }

    try {
        const pb = new PocketBase(process.env.PB_URL || 'https://pb.cashium.pro/');
        pb.authStore.save(process.env.PB_SUPERADMIN_TOKEN ?? '', null);

        await pb.collection('reported_offers').create({
            offer_id: offerId,
            description,
            client_id: clientId,
            chat_id: chatId,
            ban_level: 'user',
        });

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error('Error saving reported offer:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}