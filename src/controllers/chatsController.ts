import { Response } from 'express';
import { ClientRecord, InferenceRequest } from '../types/types.js';

export function getChatsByClientId() {
    return async (req: InferenceRequest, res: Response) => {

        let client: ClientRecord | null | undefined = req.userProfile;

        try {
            const chats = await req.pbSuperAdmin!
                .collection('chats')
                .getFullList({
                    filter: `client_id="${client?.client_id}"`,
                });
            return res.json({
                data: chats.map((chat: any) => {
                    return {
                        chat_id: chat.chat_id,
                        created: chat.created,
                        chat_name: chat.chat_name,
                        is_terminated_by_system: chat.is_terminated_by_system,
                    }
                }),
                success: true,
                error: null
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                data: null,
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
