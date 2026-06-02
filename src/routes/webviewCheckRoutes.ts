import { Router } from 'express';
import dotenv from 'dotenv';
import { initPbInstance } from '../middleware/database.js';
import { webviewCheck } from '../controllers/webviewCheckController.js';

dotenv.config();

const router = Router();

router.post('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), webviewCheck);

export default router;
