
import TimerState from '../models/TimerState.js';

export async function getOrCreateGameTimer() {

  // First, look for the current global timer.
  let timer = await TimerState.findOne({ key: 'global' });

  if (timer) {
    return timer;
  }

  // Look for an old timer document that has not yet been migrated.
  const legacy = await TimerState.collection.findOne({
    key: { $exists: false }
  });

  if (legacy) {

    let state = 'NOT_STARTED';
    let startedAt = null;
    let stoppedAt = null;
    let finalElapsedMs = 0;

    if (legacy.startTime) {

      startedAt = legacy.startTime;

      if (legacy.isRunning && !legacy.isPaused) {
        state = 'RUNNING';
      } else {
        state = 'STOPPED';

        stoppedAt = legacy.updatedAt || new Date();

        finalElapsedMs = Math.max(
          0,
          stoppedAt.getTime() -
          startedAt.getTime() -
          (legacy.pausedDuration || 0)
        );
      }
    }

    try {
      await TimerState.collection.updateOne(
        {
          _id: legacy._id,
          key: { $exists: false }
        },
        {
          $set: {
            key: 'global',
            state,
            startedAt,
            stoppedAt,
            finalElapsedMs,
            submissionSequence: 0
          }
        }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    timer = await TimerState.findOne({ key: 'global' });

    if (timer) return timer;
  }

  // Create the global timer atomically.
  try {

    timer = await TimerState.findOneAndUpdate(
      { key: 'global' },
      {
        $setOnInsert: {
          key: 'global',
          state: 'NOT_STARTED',
          startedAt: null,
          stoppedAt: null,
          finalElapsedMs: 0,
          submissionSequence: 0
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return timer;

  } catch (error) {

    // Another request may have created it simultaneously.
    if (error.code === 11000) {
      timer = await TimerState.findOne({ key: 'global' });

      if (timer) return timer;
    }

    throw error;
  }
}
