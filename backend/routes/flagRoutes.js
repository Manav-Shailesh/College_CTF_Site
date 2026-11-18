
import express from 'express';

import {
  getProgress,
  submitFlag
} from '../controllers/flagController.js';

import { getResource } from '../controllers/resourceController.js';

import { requireUser } from '../middleware/auth.js';
import { submitLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Participant progress for the current competition
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

export default router;
