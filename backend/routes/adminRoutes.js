
import express from 'express';

import { adminLogin } from '../controllers/adminAuthController.js';
import { getAdminOverview } from '../controllers/leaderboardController.js';

import {
  removeUser,
  banUser,
  unbanUser,
  getBannedEmails
} from '../controllers/adminUserController.js';

import {
  getResource,
  setResource
} from '../controllers/resourceController.js';

import { requireAdmin } from '../middleware/auth.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Admin authentication
router.post('/login', adminLoginLimiter, adminLogin);

// Admin dashboard
router.get('/overview', requireAdmin, getAdminOverview);

// User management
router.delete('/users/:email', requireAdmin, removeUser);
router.post('/users/:email/ban', requireAdmin, banUser);
router.delete('/users/:email/ban', requireAdmin, unbanUser);
router.get('/banned', requireAdmin, getBannedEmails);

// Resource management
router.get('/resource', requireAdmin, getResource);
router.post('/resource', requireAdmin, setResource);

export default router;
