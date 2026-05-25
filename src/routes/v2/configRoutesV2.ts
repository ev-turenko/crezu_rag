import { Router } from 'express';
import { getConfigV2 } from '../../controllers/v2/configControllerV2.js';
import { initPbInstance } from '../../middleware/database.js';

const router = Router();

router.get('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), getConfigV2());

export default router;
