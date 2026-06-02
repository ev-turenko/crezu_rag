import { Router } from 'express';
import { register, login, profile, resetPassword, authCallback } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile  — used as profileEndpoint for new countries
router.get('/profile', profile);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/callback?api_key=<uuid>&screen=<route>
// Issues a server-side 302 to finmatcher_global://  — required because browsers
// reject custom schemes with underscores as client-side navigation targets.
router.get('/callback', authCallback);

export default router;
