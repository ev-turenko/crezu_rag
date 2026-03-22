import { Router } from 'express';
import { processRequest, getHistory, getHistoryInfinite, getAllChats, reportMessage, getSuggestions, shareChat } from '../controllers/inferenceController.js';
import { reportOffer } from '../controllers/offersReportController.js';
import { getChatsByClientId, deleteChat } from '../controllers/chatsController.js';
import { streamAssistantResponse } from '../controllers/streamController.js';
import { checkSafety, checkSafetyStream, ensureChatName } from '../middleware/intent.js';
import { initPbInstance, checkChatsAuth } from '../middleware/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.post('/message', checkSafety(), processRequest);
router.post('/message/stream', checkSafetyStream(), ensureChatName(), streamAssistantResponse);
router.post('/chats', getAllChats);
router.post('/client/:client_id/chats', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), checkChatsAuth(), getChatsByClientId());
router.get('/client/:client_id/chats', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), checkChatsAuth(), getChatsByClientId());
router.delete('/client/:client_id/chats/:chat_id', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), checkChatsAuth(), deleteChat());
router.post('/history', getHistory);
router.post('/history/infinite', getHistoryInfinite);
router.post('/report', reportMessage);
router.post('/offers/report', reportOffer);
router.post('/suggestions', getSuggestions);
router.post('/chats/share/:chat_id', shareChat);

export default router;
