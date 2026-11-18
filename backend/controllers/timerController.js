
import mongoose from 'mongoose';
import TimerState from '../models/TimerState.js';
import { getOrCreateGameTimer } from '../utils/gameTimer.js';

export async function getTimer(req, res) {
  try {
    const timer = await getOrCreateGameTimer();

    let elapsedMs = 0;

    if (timer.state === 'RUNNING' && timer.startedAt) {
      elapsedMs = Math.max(
        0,
        Date.now() - timer.startedAt.getTime()
      );
    } else if (timer.state === 'STOPPED') {
      elapsedMs = timer.finalElapsedMs || 0;
    }

    return res.json({
      state: timer.state,
      startedAt: timer.startedAt,
      stoppedAt: timer.stoppedAt,
      elapsedMs,
      isRunning: timer.state === 'RUNNING',
      isPaused: false
    });
  } catch (err) {
    console.error('Get timer error:', err);
    return res.status(500).json({
      message: 'Could not fetch timer.'
    });
  }
}

export async function startTimer(req, res) {
  const session = await mongoose.startSession();

  try {
    const timer = await getOrCreateGameTimer();

    let started;

    await session.withTransaction(async () => {
      const now = new Date();

      started = await TimerState.findOneAndUpdate(
        {
          _id: timer._id,
          state: 'NOT_STARTED'
        },
        {
          $set: {
            state: 'RUNNING',
            startedAt: now,
            stoppedAt: null,
            finalElapsedMs: 0
          }
        },
        {
          new: true,
          session
        }
      );

      if (!started) {
        const error = new Error(
          'Timer has already been started or the game has ended.'
        );
        error.status = 409;
        throw error;
      }
    });

    return res.json({
      message: 'Competition timer started.',
      state: started.state,
      startedAt: started.startedAt
    });

  } catch (err) {
    console.error('Start timer error:', err);

    return res.status(err.status || 500).json({
      message: err.message || 'Could not start timer.'
    });
  } finally {
    await session.endSession();
  }
}

export async function stopTimer(req, res) {
  const session = await mongoose.startSession();

  try {
    const timer = await getOrCreateGameTimer();

    let stopped;

    await session.withTransaction(async () => {
      // Read the current game state inside the transaction.
      const current = await TimerState.findById(timer._id)
        .session(session);

      if (!current || current.state !== 'RUNNING') {
        const error = new Error(
          'Timer is not running or has already been stopped.'
        );
        error.status = 409;
        throw error;
      }

      const stoppedAt = new Date();

      const finalElapsedMs = Math.max(
        0,
        stoppedAt.getTime() - current.startedAt.getTime()
      );

      stopped = await TimerState.findOneAndUpdate(
        {
          _id: timer._id,
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
          session
        }
      );

      if (!stopped) {
        const error = new Error(
          'Timer state changed. Please refresh and try again.'
        );
        error.status = 409;
        throw error;
      }
    });

    return res.json({
      message: 'Competition ended. All flag submissions are closed.',
      state: stopped.state,
      stoppedAt: stopped.stoppedAt,
      elapsedMs: stopped.finalElapsedMs
    });

  } catch (err) {
    console.error('Stop timer error:', err);

    return res.status(err.status || 500).json({
      message: err.message || 'Could not stop timer.'
    });
  } finally {
    await session.endSession();
  }
}
