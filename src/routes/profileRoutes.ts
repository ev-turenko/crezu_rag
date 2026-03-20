import { Router } from 'express';
import { profileData } from '../controllers/profileController.js';

const router = Router();

router.post('/data', profileData);

export default router;
