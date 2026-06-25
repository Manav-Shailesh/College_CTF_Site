import rateLimit from 'express-rate-limit';

// Registration
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many registration attempts. Please try again later.'
  }
});

// User Login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please wait a few minutes.'
  }
});

// Admin Login
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // choose between 10-20
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many admin login attempts.'
  }
});

// Flag Submission
export const submitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 70, // choose 30-60
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many flag submissions. Please slow down.'
  }
});