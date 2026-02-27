import { Router } from 'express';
import dotenv from 'dotenv';
import { getClientIdByCookieUuid } from '../controllers/clientIdController.js';
import { initPbInstance } from '../middleware/database.js';

dotenv.config();

const router = Router();

router.get('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), getClientIdByCookieUuid());

export default router;