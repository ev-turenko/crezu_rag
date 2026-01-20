import { Router } from 'express';
import { getIncomeTypes } from '../controllers/incomeTypesController.js';

const router = Router();

router.get('/', getIncomeTypes);

export default router;