import { Router } from 'express';
import { processRequest } from '../controllers/inferenceController.js';

const router = Router();

router.post('/', processRequest);

export default router;
