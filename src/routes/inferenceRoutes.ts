import { Router } from 'express';
import { processRequest, getHistory, getAllChats, reportMessage, getSuggestions, shareChat } from '../controllers/inferenceController.js';
import { getChatsByClientId } from '../controllers/chatsController.js';
import { checkSafety } from '../middleware/intent.js';
import { getUserEntry, initPbInstance } from '../middleware/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

router.post('/message', checkSafety(), processRequest);
router.post('/chats', getAllChats);
router.post('/client/:client_id/chats', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), getUserEntry(), getChatsByClientId());
router.get('/client/:client_id/chats', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), getUserEntry(), getChatsByClientId());
router.post('/history', getHistory);
router.post('/report', reportMessage);
router.post('/suggestions', getSuggestions);
router.post('/chats/share/:chat_id', shareChat);

export default router;
