import { Router } from 'express';
import { processRequest, getHistory, getAllChats } from '../controllers/inferenceController.js';

const router = Router();

router.post('/message', processRequest);
router.post('/chats', getAllChats);
router.post('/history', getHistory);

export default router;
