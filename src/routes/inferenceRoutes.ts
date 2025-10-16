import { Router } from 'express';
import { processRequest, getHistory, getAllChats, reportMessage } from '../controllers/inferenceController.js';

const router = Router();

router.post('/message', processRequest);
router.post('/chats', getAllChats);
router.post('/history', getHistory);
router.post('/report', reportMessage);

export default router;
