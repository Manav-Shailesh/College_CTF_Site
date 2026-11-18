
import mongoose from 'mongoose';
import GameSession from '../models/GameSession.js';

// Get the current competition and its timer.
export async function getCurrentSession(req, res) {
  try {
    const game = await GameSession.findOne({ isCurrent: true }).lean();

    if (!game) {
      return res.json({
        session: null,
        message: 'No competition has been created yet.'
      });
    }

    let elapsedMs = 0;

    if (game.state === 'RUNNING' && game.startedAt) {
      elapsedMs = Math.max(
        0,
        Date.now() - new Date(game.startedAt).getTime()
      );
    } else if (game.state === 'STOPPED') {
      elapsedMs = game.finalElapsedMs || 0;
    }

    return res.json({
      session: {
        ...game,
        elapsedMs,
        isRunning: game.state === 'RUNNING'
      }
    });
  } catch (err) {
    console.error('Get current session error:', err);
    return res.status(500).json({
      message: 'Could not fetch current competition.'
    });
  }
}


// Public list of competitions for the leaderboard selector.
// Only returns information needed to identify and select a competition.
export async function getPublicSessions(req, res) {
  try {
    const sessions = await GameSession.find({})
      .select('_id name sessionNumber state startedAt stoppedAt isCurrent')
      .sort({ sessionNumber: -1 })
      .lean();

    return res.json({ sessions });
  } catch (err) {
    console.error('Get public sessions error:', err);

    return res.status(500).json({
      message: 'Could not fetch competition list.'
    });
  }
}


// List current and archived competitions.
export async function getAllSessions(req, res) {
  try {
    const sessions = await GameSession.find({})
      .sort({ sessionNumber: -1 })
      .lean();

    return res.json({ sessions });
  } catch (err) {
    console.error('Get sessions error:', err);
    return res.status(500).json({
      message: 'Could not fetch competitions.'
    });
  }
}

// Create a new competition.
// The previous competition must already be stopped.
export async function createSession(req, res) {
  const dbSession = await mongoose.startSession();

  try {
    const name =
      typeof req.body?.name === 'string' && req.body.name.trim()
        ? req.body.name.trim()
        : null;

    if (name && name.length > 100) {
      return res.status(400).json({
        message: 'Competition name cannot exceed 100 characters.'
      });
    }

    let createdSession;

    await dbSession.withTransaction(async () => {
      const current = await GameSession.findOne({
        isCurrent: true
      }).session(dbSession);

      if (current && current.state !== 'STOPPED') {
        const error = new Error(
          current.state === 'RUNNING'
            ? 'Stop the current competition before creating another.'
            : 'The current competition has not started yet.'
        );

        error.status = 409;
        throw error;
      }

      // Archive the previous competition.
      if (current) {
        const archived = await GameSession.updateOne(
          {
            _id: current._id,
            isCurrent: true,
            state: 'STOPPED'
          },
          {
            $set: { isCurrent: false }
          },
          { session: dbSession }
        );

        if (archived.modifiedCount !== 1) {
          const error = new Error(
            'Competition state changed. Please refresh and try again.'
          );
          error.status = 409;
          throw error;
        }
      }

      const lastSession = await GameSession.findOne({})
        .sort({ sessionNumber: -1 })
        .select('sessionNumber')
        .session(dbSession)
        .lean();

      const nextNumber = (lastSession?.sessionNumber || 0) + 1;

      const [newSession] = await GameSession.create(
        [
          {
            name: name || `NOX CTF #${nextNumber}`,
            sessionNumber: nextNumber,
            state: 'NOT_STARTED',
            isCurrent: true,
            startedAt: null,
            stoppedAt: null,
            finalElapsedMs: 0,
            submissionSequence: 0,
            createdBy: 'admin'
          }
        ],
        { session: dbSession }
      );

      createdSession = newSession;
    });

    return res.status(201).json({
      message: 'New competition created successfully.',
      session: createdSession
    });
  } catch (err) {
    console.error('Create session error:', err);

    return res.status(err.status || (err.code === 11000 ? 409 : 500)).json({
      message:
        err.code === 11000
          ? 'Another session may have been created simultaneously. Refresh and try again.'
          : err.message || 'Could not create competition.'
    });
  } finally {
    await dbSession.endSession();
  }
}

// Start the current competition.
export async function startSession(req, res) {
  const dbSession = await mongoose.startSession();

  try {
    let started;

    await dbSession.withTransaction(async () => {
      const current = await GameSession.findOneAndUpdate(
        {
          isCurrent: true,
          state: 'NOT_STARTED'
        },
        {
          $set: {
            state: 'RUNNING',
            startedAt: new Date(),
            stoppedAt: null,
            finalElapsedMs: 0
          }
        },
        {
          new: true,
          session: dbSession
        }
      );

      if (!current) {
        const error = new Error(
          'No competition is waiting to start. Create a new competition or refresh.'
        );
        error.status = 409;
        throw error;
      }

      started = current;
    });

    return res.json({
      message: 'Competition started successfully.',
      session: started
    });
  } catch (err) {
    console.error('Start session error:', err);

    return res.status(err.status || 500).json({
      message: err.message || 'Could not start competition.'
    });
  } finally {
    await dbSession.endSession();
  }
}

// Stop the current competition and permanently close submissions.
export async function stopSession(req, res) {
  const dbSession = await mongoose.startSession();

  try {
    let stopped;

    await dbSession.withTransaction(async () => {
      const current = await GameSession.findOne({
        isCurrent: true,
        state: 'RUNNING'
      }).session(dbSession);

      if (!current || !current.startedAt) {
        const error = new Error(
          'No running competition was found.'
        );
        error.status = 409;
        throw error;
      }

      const stoppedAt = new Date();

      const finalElapsedMs = Math.max(
        0,
        stoppedAt.getTime() - current.startedAt.getTime()
      );

      stopped = await GameSession.findOneAndUpdate(
        {
          _id: current._id,
          isCurrent: true,
          state: 'RUNNING'
        },
        {
          $set: {
            state: 'STOPPED',
            stoppedAt,
            finalElapsedMs
          }
        },
        {
          new: true,
          session: dbSession
        }
      );

      if (!stopped) {
        const error = new Error(
          'Competition state changed. Refresh and try again.'
        );
        error.status = 409;
        throw error;
      }
    });

    return res.json({
      message: 'Competition ended. All new flag submissions are closed.',
      session: stopped
    });
  } catch (err) {
    console.error('Stop session error:', err);

    return res.status(err.status || 500).json({
      message: err.message || 'Could not stop competition.'
    });
  } finally {
    await dbSession.endSession();
  }
}
