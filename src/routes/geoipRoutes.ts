import { Router } from 'express';
import { geoipProxy } from '../controllers/geoipController.js';

const router = Router();

router.use('/', geoipProxy);
router.use('/*rest', geoipProxy);

export default router;