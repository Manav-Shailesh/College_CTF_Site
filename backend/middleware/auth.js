import { verifyUserToken, verifyAdminToken } from '../utils/token.js';
import User from '../models/User.js';

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function requireUser(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  try {
    const payload = verifyUserToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

export function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  try {
    const payload = verifyAdminToken(token);
    if (!payload.isAdmin) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin session.' });
  }
}