import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { requireUser } from '../middleware/auth.js';
import {registerLimiter,loginLimiter} from '../middleware/rateLimiter.js';

const router = express.Router();
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', requireUser, me);

export default router;