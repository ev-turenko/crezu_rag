import { Router } from 'express';
import { testMiddleware } from '../controllers/testController.js';
import { checkSafety } from '../middleware/intent.js';
import type { Response } from 'express';
import { InferenceRequest } from '../types/types.js';

const router = Router();

// Test endpoint with the checkSafety middleware
router.post('/:country', checkSafety(), (req: InferenceRequest, res: Response) => testMiddleware(req, res));

export default router;
