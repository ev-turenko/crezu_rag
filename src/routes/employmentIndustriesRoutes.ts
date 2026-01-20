import { Router } from 'express';
import { getEmploymentIndustries } from '../controllers/employmentIndustriesController.js';

const router = Router();

router.get('/', getEmploymentIndustries);

export default router;