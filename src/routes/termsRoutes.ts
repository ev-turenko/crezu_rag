import { Router } from 'express';
import { getTermsAndConditions } from '../controllers/termsController.js';

const router = Router();
router.get('/:code/terms-and-conditions', getTermsAndConditions());
export default router;
