import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { getAdminOverview } from '../controllers/leaderboardController.js';
import { removeUser, banUser, unbanUser, getBannedEmails } from '../controllers/adminUserController.js';
import { setResource } from '../controllers/resourceController.js';
import { requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, adminLogin);
router.get('/overview', requireAdmin, getAdminOverview);
router.delete('/users/:email', requireAdmin, removeUser);
router.post('/users/:email/ban', requireAdmin, banUser);
router.delete('/users/:email/ban', requireAdmin, unbanUser);
router.get('/banned', requireAdmin, getBannedEmails);
router.post('/resource', requireAdmin, setResource);

export default router;