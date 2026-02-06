import { Router } from 'express';
import { ViewChatController } from '../controllers/viewChatController.js';

const router = Router();
const viewChatController = new ViewChatController();

router.get('/chat/:chat_id/pdf', (req, res) => viewChatController.downloadSharedChatPdf(req, res));
router.get('/chat/:chat_id', (req, res) => viewChatController.viewSharedChat(req, res));

export default router;
