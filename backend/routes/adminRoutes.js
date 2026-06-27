import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { getAdminOverview } from '../controllers/leaderboardController.js';
import { removeUser, banUser, unbanUser, getBannedEmails } from '../controllers/adminUserController.js';
import { setResource } from '../controllers/resourceController.js';
import { requireAdmin } from '../middleware/auth.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
import { getTimer, startTimer, stopTimer, pauseTimer, continueTimer, resetTimer } from '../controllers/timerController.js';

const router = express.Router();

router.post('/login', adminLoginLimiter, adminLogin);
router.get('/overview', requireAdmin, getAdminOverview);
router.delete('/users/:email', requireAdmin, removeUser);
router.post('/users/:email/ban', requireAdmin, banUser);
router.delete('/users/:email/ban', requireAdmin, unbanUser);
router.get('/banned', requireAdmin, getBannedEmails);
router.post('/resource', requireAdmin, setResource);


router.get('/timer', requireAdmin, getTimer);
router.post('/timer/start', requireAdmin, startTimer);
router.post('/timer/stop', requireAdmin, stopTimer);
router.post('/timer/pause', requireAdmin, pauseTimer);
router.post('/timer/continue', requireAdmin, continueTimer);
router.post('/timer/reset', requireAdmin, resetTimer);

export default router;