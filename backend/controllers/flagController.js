import bcrypt from 'bcryptjs';
import Flag from '../models/Flag.js';
import User, { SINS } from '../models/User.js';

export async function getProgress(req, res) {
  const progress = {};
  for (const sin of SINS) {
    const entry = req.user.progress.get(sin) || { solved: false, solvedAt: null, attempts: 0 };
    progress[sin] = entry;
  }
  return res.json({
    progress,
    firstSolveAt: req.user.firstSolveAt,
    completedAt: req.user.completedAt
  });
}

export async function submitFlag(req, res) {
  try {
    const { sin } = req.params;
    const { candidate } = req.body;

    if (!SINS.includes(sin)) {
      return res.status(400).json({ message: 'Unknown sin.' });
    }
    if (!candidate || !candidate.trim()) {
      return res.status(400).json({ message: 'Enter a flag before validating.' });
    }
    import TimerState from '../models/TimerState.js';

    const timer = await TimerState.findOne({});
    if (!timer || !timer.isRunning || timer.isPaused) {
      return res.status(403).json({ message: 'Timer is not running. Submissions are not allowed.' });
    }

    const flagDoc = await Flag.findOne({ sin });
    if (!flagDoc) {
      return res.status(500).json({ message: 'This challenge is not configured yet.' });
    }

    const user = req.user;
    const entry = user.progress.get(sin) || { solved: false, solvedAt: null, attempts: 0 };

    if (entry.solved) {
      return res.json({
        correct: true,
        alreadySolved: true,
        message: `${flagDoc.label} flag was already verified.`
      });
    }

    entry.attempts += 1;
    const isCorrect = await bcrypt.compare(candidate.trim(), flagDoc.answerHash);

    if (!isCorrect) {
      user.progress.set(sin, entry);
      await user.save();
      return res.json({
        correct: false,
        message: `Access denied - invalid flag for ${flagDoc.label.toUpperCase()}.`
      });
    }

    const now = new Date();
    entry.solved = true;
    entry.solvedAt = now;
    user.progress.set(sin, entry);

    if (!user.firstSolveAt) {
      user.firstSolveAt = now;
    }

    const solvedCount = SINS.filter((s) => user.progress.get(s)?.solved).length;
    if (solvedCount === SINS.length && !user.completedAt) {
      user.completedAt = now;
    }

    await user.save();

    return res.json({
      correct: true,
      alreadySolved: false,
      message: `Access granted - ${flagDoc.label.toUpperCase()} flag verified.`,
      completed: Boolean(user.completedAt)
    });
   
    if (user.solvedCount === 7 && !user.completedAt) {
  user.completionTime = Date.now() - timer.startTime.getTime() - timer.pausedDuration;
}
  } catch (err) {
    console.error('Submit flag error:', err);
    return res.status(500).json({ message: 'Something went wrong validating that flag.' });
  }
}