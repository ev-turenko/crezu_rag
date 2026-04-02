import { Router } from 'express';
import { getConfig } from '../controllers/configController.js';
import { initPbInstance } from '../middleware/database.js';

const router = Router();

router.get('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), getConfig());

export default router;