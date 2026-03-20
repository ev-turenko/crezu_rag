import { Router } from 'express';
import { getLanguages } from '../controllers/languagesController.js';

const router = Router();

router.get('/', getLanguages());

export default router;
