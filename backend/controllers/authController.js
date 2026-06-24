import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import BannedEmail from '../models/BannedEmail.js';
import { signUserToken } from '../utils/token.js';

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAIN || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isAllowedEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.christuniversity\.in$/i.test(
    email.trim()
  );
}


/*function isAllowedEmail(email) {
  if (allowedDomains.length === 0) return true;
  const lower = email.toLowerCase();
  return allowedDomains.some((domain) => lower.endsWith('@' + domain));
}*/

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email };
}

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function passwordIssues(password, username, email) {
  if (!PASSWORD_RULE.test(password)) {
    return 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
  }
  const lowerPw = password.toLowerCase();
  const localPart = email.split('@')[0]?.toLowerCase() || '';
  if (username && lowerPw.includes(username.trim().toLowerCase())) {
    return 'Password cannot contain your username.';
  }
  if (localPart && lowerPw.includes(localPart)) {
    return 'Password cannot contain the part of your email before the @.';
  }
  return null;
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are all required.' });
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        message: `Registration is restricted to ${allowedDomains.join(', ')} email addresses.`
      });
    }
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        message: `Registration is restricted to ${allowedDomains.join(', ')} email addresses.`
      });
    }
    const isBanned = await BannedEmail.findOne({ email: email.toLowerCase().trim() });
    if (isBanned) {
      return res.status(403).json({ message: 'This email address is not permitted to register.' });
    }
    if (trimmedUsername.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(400).json({ message: 'Username and email cannot be the same.' });
    }

    const pwIssue = passwordIssues(password, trimmedUsername, email);
    if (pwIssue) {
      return res.status(400).json({ message: pwIssue });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const existingUsername = await User.findOne({
      username: { $regex: `^${trimmedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    if (existingUsername) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: trimmedUsername,
      email: email.toLowerCase().trim(),
      passwordHash
    });

    const token = signUserToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Something went wrong during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signUserToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong during login.' });
  }
}

export async function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}