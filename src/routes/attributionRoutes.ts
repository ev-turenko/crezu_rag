import { Router } from 'express';
import dotenv from 'dotenv';
import { saveAttribution } from '../controllers/attributionController.js';
import { initPbInstance } from '../middleware/database.js';

dotenv.config();

const router = Router();

router.post('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), saveAttribution);

export default router;