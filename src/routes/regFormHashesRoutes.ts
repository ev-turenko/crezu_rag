import { Router } from 'express';
import { checkRegFormHashes } from '../controllers/regFormHashesController.js';

const router = Router();

router.get('/check-hashes', checkRegFormHashes);

export default router;
