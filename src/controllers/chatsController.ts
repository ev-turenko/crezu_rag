import { Response } from 'express';
import { ClientRecord, InferenceRequest } from '../types/types.js';
import { dateGroups } from '../utils/common.js';

function getDateGroup(dateString: string): string {
    const createdDate = new Date(dateString);
    const today = new Date();
    
    // Reset time parts for date comparisons
    const created = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if today
    if (created.getTime() === todayDate.getTime()) {
        return dateGroups.today;
    }
    
    // Check if yesterday
    if (created.getTime() === yesterday.getTime()) {
        return dateGroups.yesterday;
    }
    
    // Get week start (Monday)
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };
    
    const createdWeekStart = getWeekStart(created);
    const todayWeekStart = getWeekStart(todayDate);
    
    // Check if this week
    if (createdWeekStart.getTime() === todayWeekStart.getTime()) {
        return dateGroups.this_week;
    }
    
    // Check if last week
    const lastWeekStart = new Date(todayWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    if (createdWeekStart.getTime() === lastWeekStart.getTime()) {
        return dateGroups.last_week;
    }
    
    // Check if this month
    if (created.getFullYear() === todayDate.getFullYear() && 
        created.getMonth() === todayDate.getMonth()) {
        return dateGroups.this_month;
    }
    
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthKey = monthNames[created.getMonth()] as keyof typeof dateGroups;
    return dateGroups[monthKey];
}

export function getChatsByClientId() {
    return async (req: InferenceRequest, res: Response) => {

        let client: ClientRecord | null | undefined = req.userProfile;

        try {
            console.log("CLIENT", client)
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
                        date_group: getDateGroup(chat.created),
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
