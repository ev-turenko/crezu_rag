import { Router } from 'express';
import { InferenceController } from '../../controllers/v2/InferenceController.js';
import { initDefaults } from '../../middleware/defaults.js';
import { checkSafety } from '../../middleware/intent.js';

const router = Router();

router.post('/message', initDefaults(), checkSafety(), InferenceController.getAiResponse());

export default router;
