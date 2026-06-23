import express from 'express';
import { getProgress, submitFlag } from '../controllers/flagController.js';
import { requireUser } from '../middleware/auth.js';
import { submitLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.get('/progress', requireUser, getProgress);
router.post('/:sin/submit', requireUser, submitLimiter, submitFlag);

export default router;