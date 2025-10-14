import { Router } from 'express';
import { processRequest, getHistory } from '../controllers/inferenceController.js';

const router = Router();

router.post('/message', processRequest);
router.post('/history', getHistory);

export default router;
