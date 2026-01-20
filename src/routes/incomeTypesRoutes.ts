import { Router } from 'express';
import { getIncomeTypes } from '../controllers/incomeTypesController.js';

const router = Router();

router.get('/income-types', getIncomeTypes);

export default router;