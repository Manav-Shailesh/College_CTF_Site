
import express from 'express';

import {
  getCurrentSession,
  getPublicSessions,
  getAllSessions,
  createSession,
  startSession,
  stopSession
} from '../controllers/sessionController.js';

import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Current competition information
router.get('/current', getCurrentSession);

// Public list of current and archived competitions
router.get('/public', getPublicSessions);

// Admin-only competition management
router.get('/all', requireAdmin, getAllSessions);
router.post('/create', requireAdmin, createSession);
router.post('/start', requireAdmin, startSession);
router.post('/stop', requireAdmin, stopSession);

export default router;
