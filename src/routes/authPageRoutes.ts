import { Router } from 'express';
import { serveAuthPage } from '../controllers/authPageController.js';

const router = Router();

// GET /auth/:country_code  — opened by the app in a webview
// Also accepts ?screen=register|reset query param
router.get('/:country_code', serveAuthPage);

export default router;
