import { Router } from 'express';
import { OffersController } from '../controllers/offersController.js';

const router = Router();
const controller = new OffersController();

router.get('/', controller.getOffers());

export default router;
