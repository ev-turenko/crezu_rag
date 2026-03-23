import { Router } from 'express';
import { requestAccountDeletion } from '../controllers/accountDeletionController.js';

const router = Router();

router.post('/request', requestAccountDeletion());

export default router;
