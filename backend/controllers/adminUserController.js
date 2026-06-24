import User from '../models/User.js';
import BannedEmail from '../models/BannedEmail.js';

export async function removeUser(req, res) {
  try {
    const { email } = req.params;
    const decoded = decodeURIComponent(email).toLowerCase().trim();

    const user = await User.findOneAndDelete({ email: decoded });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email.' });
    }

    return res.json({ message: `User ${user.username} (${decoded}) has been removed.` });
  } catch (err) {
    console.error('Remove user error:', err);
    return res.status(500).json({ message: 'Failed to remove user.' });
  }
}

export async function banUser(req, res) {
  try {
    const { email } = req.params;
    const decoded = decodeURIComponent(email).toLowerCase().trim();

    // Ban the email first so even if user deletion fails, they can't re-register
    await BannedEmail.findOneAndUpdate(
      { email: decoded },
      { email: decoded, bannedAt: new Date() },
      { upsert: true }
    );

    // Also remove the user account if it exists
    const user = await User.findOneAndDelete({ email: decoded });

    return res.json({
      message: user
        ? `User ${user.username} (${decoded}) has been banned and removed.`
        : `Email ${decoded} has been banned. No existing account was found.`
    });
  } catch (err) {
    console.error('Ban user error:', err);
    return res.status(500).json({ message: 'Failed to ban user.' });
  }
}

export async function unbanUser(req, res) {
  try {
    const { email } = req.params;
    const decoded = decodeURIComponent(email).toLowerCase().trim();

    const result = await BannedEmail.findOneAndDelete({ email: decoded });
    if (!result) {
      return res.status(404).json({ message: 'That email is not currently banned.' });
    }

    return res.json({ message: `${decoded} has been unbanned.` });
  } catch (err) {
    console.error('Unban error:', err);
    return res.status(500).json({ message: 'Failed to unban email.' });
  }
}

export async function getBannedEmails(req, res) {
  try {
    const banned = await BannedEmail.find({}).sort({ bannedAt: -1 }).lean();
    return res.json({ banned });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch banned list.' });
  }
}