import { Router } from 'express';
import { OffersController } from '../controllers/offersController.js';
import { initPbInstance } from '../middleware/database.js';

const router = Router();
const controller = new OffersController();

router.get('/', initPbInstance(process.env.PB_URL || 'https://pb.cashium.pro/'), controller.getOffers());

export default router;
