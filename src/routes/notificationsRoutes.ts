import { Router } from 'express';
import { saveNotifications } from '../controllers/notificationsController.js';

const router = Router();

router.post('/', saveNotifications);

export default router;
