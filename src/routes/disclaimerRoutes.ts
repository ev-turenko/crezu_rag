import { Router } from 'express';
import { getDisclaimer } from '../controllers/disclaimerController.js';

const router = Router();

router.get('/', getDisclaimer);

export default router;
