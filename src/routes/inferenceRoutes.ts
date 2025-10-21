import { Router } from 'express';
import { processRequest, getHistory, getAllChats, reportMessage, getSuggestions } from '../controllers/inferenceController.js';

const router = Router();

router.post('/message', processRequest);
router.post('/chats', getAllChats);
router.post('/history', getHistory);
router.post('/report', reportMessage);
router.post('/suggestions', getSuggestions);

export default router;
