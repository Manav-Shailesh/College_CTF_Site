
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Flag from '../models/Flag.js';
import User, { SINS } from '../models/User.js';
import GameSession from '../models/GameSession.js';
import SessionProgress from '../models/SessionProgress.js';

class GameStateError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

function createEmptyProgress() {
  return Object.fromEntries(
    SINS.map((sin) => [
      sin,
      {
        solved: false,
        solvedAt: null,
        attempts: 0
      }
    ])
  );
}

function formatProgress(sessionProgress) {
  const progress = {};

  for (const sin of SINS) {
    const entry = sessionProgress?.progress?.get(sin);

    progress[sin] = entry
      ? {
          solved: entry.solved,
          solvedAt: entry.solvedAt,
          attempts: entry.attempts
        }
      : {
          solved: false,
          solvedAt: null,
          attempts: 0
        };
  }

  return progress;
}

export async function getProgress(req, res) {
  try {
    const [user, currentSession] = await Promise.all([
      User.findById(req.user._id),
      GameSession.findOne({ isCurrent: true })
    ]);

    if (!user) {
      return res.status(401).json({
        message: 'User account no longer exists.'
      });
    }

    if (!currentSession) {
      return res.json({
        progress: createEmptyProgress(),
        firstSolveAt: null,
        completedAt: null,
        completionTimeMs: null,
        sessionId: null,
        sessionState: null
      });
    }

    let sessionProgress = await SessionProgress.findOne({
      sessionId: currentSession._id,
      userId: user._id
    });

    if (!sessionProgress) {
      try {
        sessionProgress = await SessionProgress.create({
          sessionId: currentSession._id,
          userId: user._id,
          usernameSnapshot: user.username,
          emailSnapshot: user.email
        });
      } catch (err) {
        // Another simultaneous request may have created it.
        if (err.code !== 11000) {
          throw err;
        }

        sessionProgress = await SessionProgress.findOne({
          sessionId: currentSession._id,
          userId: user._id
        });
      }
    }

    return res.json({
      progress: formatProgress(sessionProgress),
      firstSolveAt: sessionProgress.firstSolveAt,
      completedAt: sessionProgress.completedAt,
      completionTimeMs: sessionProgress.completionTimeMs,
      sessionId: currentSession._id,
      sessionState: currentSession.state
    });

  } catch (err) {
    console.error('Get progress error:', err);

    return res.status(500).json({
      message: 'Could not fetch progress.'
    });
  }
}

export async function submitFlag(req, res) {
  const transaction = await mongoose.startSession();

  try {
    const { sin } = req.params;
    const { candidate } = req.body || {};

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

    const currentSession = await GameSession.findOne({
      isCurrent: true
    });

    if (
  !currentSession ||
  currentSession.state !== 'RUNNING' ||
  !currentSession.startedAt
) {
      throw new GameStateError(
        'GAME ENDED. The administrator has closed flag submissions.',
        403
      );
    }

    const flagDoc = await Flag.findOne({ sin });

    if (!flagDoc) {
      return res.status(500).json({
        message: 'This challenge is not configured yet.'
      });
    }

    // Verify the flag before opening the transaction.
    // The game state is checked again inside the transaction.
    const isCorrect = await bcrypt.compare(
      candidate.trim(),
      flagDoc.answerHash
    );

    let result;

    await transaction.withTransaction(async () => {

      // Every submission writes to the current GameSession document.
      // Stop Session also writes to this same document.
      // This makes the session state check atomic with submissions.
      const activeSession = await GameSession.findOneAndUpdate(
        {
          _id: currentSession._id,
          isCurrent: true,
          state: 'RUNNING'
        },
        {
          $inc: {
            submissionSequence: 1
          }
        },
        {
          new: true,
          session: transaction
        }
      );

      if (!activeSession) {
        throw new GameStateError(
          'GAME ENDED. The administrator has closed flag submissions.',
          403
        );
      }

      const user = await User.findById(req.user._id)
        .session(transaction);

      if (!user) {
        throw new GameStateError(
          'User account no longer exists.',
          401
        );
      }

      let sessionProgress = await SessionProgress.findOne({
        sessionId: activeSession._id,
        userId: user._id
      }).session(transaction);

      if (!sessionProgress) {
        sessionProgress = new SessionProgress({
          sessionId: activeSession._id,
          userId: user._id,
          usernameSnapshot: user.username,
          emailSnapshot: user.email
        });
      }

      const entry = sessionProgress.progress.get(sin) || {
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
        sessionProgress.progress.set(sin, entry);

        await sessionProgress.save({
          session: transaction
        });

        result = {
          correct: false,
          message: `Access denied - invalid flag for ${flagDoc.label.toUpperCase()}.`
        };

        return;
      }

      const now = new Date();

      entry.solved = true;
      entry.solvedAt = now;

      sessionProgress.progress.set(sin, entry);

      if (!sessionProgress.firstSolveAt) {
        sessionProgress.firstSolveAt = now;
      }

      const solvedCount = SINS.filter(
        (key) => sessionProgress.progress.get(key)?.solved
      ).length;

      if (
        solvedCount === SINS.length &&
        !sessionProgress.completedAt
      ) {
        sessionProgress.completedAt = now;

       if (!activeSession.startedAt) {
  throw new GameStateError(
    'Competition start time is missing. Submission cancelled.',
    409
  );
}

sessionProgress.completionTimeMs = Math.max(
  0,
  now.getTime() - new Date(activeSession.startedAt).getTime()
);

      }

      await sessionProgress.save({
        session: transaction
      });

      result = {
        correct: true,
        alreadySolved: false,
        message: `Access granted - ${flagDoc.label.toUpperCase()} flag verified.`,
        completed: Boolean(sessionProgress.completedAt),
        completionTimeMs: sessionProgress.completionTimeMs
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
    await transaction.endSession();
  }
}
