import { Router } from 'express';
import { processRequest, getHistory, getAllChats, reportMessage, getSuggestions, shareChat } from '../controllers/inferenceController.js';

const router = Router();

router.post('/message', processRequest);
router.post('/chats', getAllChats);
router.post('/history', getHistory);
router.post('/report', reportMessage);
router.post('/suggestions', getSuggestions);
router.post('/chats/share/:chat_id', shareChat);

export default router;
