import { Router } from 'express';
import { getPrivacyPolicy } from '../controllers/legalController.js';

const router = Router();
router.get('/:code/privacy-policy', getPrivacyPolicy());
export default router;
