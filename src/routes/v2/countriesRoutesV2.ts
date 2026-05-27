import { Router } from 'express';
import { getCountriesV2 } from '../../controllers/v2/countriesControllerV2.js';

const router = Router();

router.get('/', getCountriesV2());

export default router;
