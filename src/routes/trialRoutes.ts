import { Router } from 'express';
import dotenv from 'dotenv';
import { getTrialStatus, checkTrialEligibility, acceptTrial } from '../controllers/trialController.js';
import { initPbInstance } from '../middleware/database.js';

dotenv.config();

const router = Router();
const PB_URL = process.env.PB_URL || 'https://pb.cashium.pro/';

router.get('/status', initPbInstance(PB_URL), getTrialStatus);
router.get('/eligible', initPbInstance(PB_URL), checkTrialEligibility);
router.post('/accept', initPbInstance(PB_URL), acceptTrial);

export default router;
