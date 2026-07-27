import { Router } from 'express';
import { OfferFeedController } from '../controllers/offerFeedController.js';

const router = Router();
const controller = new OfferFeedController();

router.get('/', controller.getFeed());

export default router;
