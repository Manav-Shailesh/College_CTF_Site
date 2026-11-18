
import express from 'express';

import {
  getProgress,
  submitFlag
} from '../controllers/flagController.js';

import { getResource } from '../controllers/resourceController.js';

import { requireUser } from '../middleware/auth.js';
import { submitLimiter } from '../middleware/rateLimiter.js';

import { getTimer } from '../controllers/timerController.js';

const router = express.Router();

// Participant progress
router.get('/progress', requireUser, getProgress);

// Flag submissions
router.post(
  '/:sin/submit',
  requireUser,
  submitLimiter,
  submitFlag
);

// Participant resources
router.get('/resource', requireUser, getResource);

// Public timer status for participants
router.get('/timer', getTimer);

export default router;
