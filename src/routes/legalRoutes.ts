import { Router } from 'express';
import { getPrivacyPolicy } from '../controllers/legalController.js';
import { getTermsAndConditions } from '../controllers/termsController.js';

const router = Router();
router.get('/:code/privacy-policy', getPrivacyPolicy());
router.get('/:code/terms-and-conditions', getTermsAndConditions());
export default router;
