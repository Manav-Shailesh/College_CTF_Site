
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Flag from '../models/Flag.js';
import User, { SINS } from '../models/User.js';
import TimerState from '../models/TimerState.js';

import { getOrCreateGameTimer } from '../utils/gameTimer.js';

class GameStateError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function getProgress(req, res) {
  try {
    const user = await User.findById(req.user._id);

    const progress = {};

    for (const sin of SINS) {
      const entry = user.progress.get(sin) || {
        solved: false,
        solvedAt: null,
        attempts: 0
      };

      progress[sin] = entry;
    }

    return res.json({
      progress,
      firstSolveAt: user.firstSolveAt,
      completedAt: user.completedAt
    });
  } catch (err) {
    console.error('Get progress error:', err);

    return res.status(500).json({
      message: 'Could not fetch progress.'
    });
  }
}

export async function submitFlag(req, res) {
  const session = await mongoose.startSession();

  try {
    const { sin } = req.params;
    const { candidate } = req.body;

    if (!SINS.includes(sin)) {
      return res.status(400).json({
        message: 'Unknown sin.'
      });
    }

    if (
      typeof candidate !== 'string' ||
      !candidate.trim()
    ) {
      return res.status(400).json({
        message: 'Enter a flag before validating.'
      });
    }

    const timer = await getOrCreateGameTimer();

    const flagDoc = await Flag.findOne({ sin });

    if (!flagDoc) {
      return res.status(500).json({
        message: 'This challenge is not configured yet.'
      });
    }

    // Perform expensive bcrypt comparison before opening
    // the transaction. Game state is checked again inside it.
    const isCorrect = await bcrypt.compare(
      candidate.trim(),
      flagDoc.answerHash
    );

    let result;

    await session.withTransaction(async () => {

      // CRITICAL:
      // Every submission writes to the global timer document.
      // Stop Timer also writes to this same document.
      // MongoDB therefore serializes these competing writes.
      const activeTimer = await TimerState.findOneAndUpdate(
        {
          _id: timer._id,
          state: 'RUNNING'
        },
        {
          $inc: {
            submissionSequence: 1
          }
        },
        {
          new: true,
          session
        }
      );

      if (!activeTimer) {
        throw new GameStateError(
          'GAME ENDED. The administrator has closed flag submissions.',
          403
        );
      }

      // Always reload the user inside the transaction.
      const user = await User.findById(req.user._id)
        .session(session);

      if (!user) {
        throw new GameStateError(
          'User account no longer exists.',
          401
        );
      }

      const entry = user.progress.get(sin) || {
        solved: false,
        solvedAt: null,
        attempts: 0
      };

      if (entry.solved) {
        result = {
          correct: true,
          alreadySolved: true,
          message: `${flagDoc.label} flag was already verified.`
        };
        return;
      }

      entry.attempts += 1;

      if (!isCorrect) {
        user.progress.set(sin, entry);

        await user.save({ session });

        result = {
          correct: false,
          message: `Access denied - invalid flag for ${flagDoc.label.toUpperCase()}.`
        };

        return;
      }

      const now = new Date();

      entry.solved = true;
      entry.solvedAt = now;

      user.progress.set(sin, entry);

      if (!user.firstSolveAt) {
        user.firstSolveAt = now;
      }

      const solvedCount = SINS.filter(
        (key) => user.progress.get(key)?.solved
      ).length;

      if (
        solvedCount === SINS.length &&
        !user.completedAt
      ) {
        user.completedAt = now;

        // Preserve completion time as elapsed game time.
        user.completionTime = Math.max(
          0,
          now.getTime() - activeTimer.startedAt.getTime()
        );
      }

      await user.save({ session });

      result = {
        correct: true,
        alreadySolved: false,
        message: `Access granted - ${flagDoc.label.toUpperCase()} flag verified.`,
        completed: Boolean(user.completedAt)
      };
    });

    return res.json(result);

  } catch (err) {
    if (err instanceof GameStateError) {
      return res.status(err.status).json({
        message: err.message,
        gameEnded: true
      });
    }

    console.error('Submit flag error:', err);

    return res.status(500).json({
      message: 'Something went wrong validating that flag.'
    });
  } finally {
    await session.endSession();
  }
}
