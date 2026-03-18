import { Router } from 'express';
import { handleSearch } from '../controllers/searchController.js';

const router = Router();

router.get('/', handleSearch());
router.post('/', handleSearch());

export default router;
