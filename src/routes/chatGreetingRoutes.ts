import { Router } from 'express';
import { getChatGreeting } from '../controllers/chatGreetingController.js';

const router = Router();

router.get('/', getChatGreeting);

export default router;
