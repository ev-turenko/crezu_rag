import { Router } from 'express';
import { healthcheck, mongoHealthcheck } from '../controllers/healthcheckController.js';

const router = Router();

router.get('/', healthcheck);
router.get('/mongo', mongoHealthcheck);

export default router;