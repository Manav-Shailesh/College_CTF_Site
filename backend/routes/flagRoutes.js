import express from 'express';
import { getProgress, submitFlag } from '../controllers/flagController.js';
import { getResource } from '../controllers/resourceController.js';
import { requireUser } from '../middleware/auth.js';
import { submitLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.get('/progress', requireUser, getProgress);
router.post('/:sin/submit', requireUser, submitLimiter, submitFlag);
router.get('/resource', requireUser, getResource)
router.get('/timer', getTimer);

export default router;