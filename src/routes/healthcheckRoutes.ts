import { Router } from 'express';
import { healthcheck } from '../controllers/HealthcheckController.js';

const router = Router();

router.get('/', healthcheck);

export default router;