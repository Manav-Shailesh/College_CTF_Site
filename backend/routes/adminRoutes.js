import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { getAdminOverview } from '../controllers/leaderboardController.js';
import { requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.post('/login', authLimiter, adminLogin);
router.get('/overview', requireAdmin, getAdminOverview);

export default router;