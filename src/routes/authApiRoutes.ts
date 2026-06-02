import { Router } from 'express';
import { register, login, profile, resetPassword } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile  — used as profileEndpoint for new countries
router.get('/profile', profile);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
