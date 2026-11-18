
import TimerState from '../models/TimerState.js';

export async function getOrCreateGameTimer() {
  let rawTimer = await TimerState.collection.findOne({});

  if (!rawTimer) {
    try {
      return await TimerState.create({
        key: 'global',
        state: 'NOT_STARTED',
        startedAt: null,
        stoppedAt: null,
        finalElapsedMs: 0,
        submissionSequence: 0
      });
    } catch (error) {
      // Another request may have created it simultaneously.
      if (error.code === 11000) {
        return await TimerState.findOne({ key: 'global' });
      }
      throw error;
    }
  }

  // Migrate the previous timer format once.
  if (!rawTimer.state) {
    let state = 'NOT_STARTED';
    let startedAt = null;
    let stoppedAt = null;
    let finalElapsedMs = 0;

    if (rawTimer.startTime) {
      startedAt = rawTimer.startTime;

      if (rawTimer.isRunning && !rawTimer.isPaused) {
        state = 'RUNNING';
      } else {
        // A previously paused/stopped game stays locked.
        state = 'STOPPED';
        stoppedAt = rawTimer.updatedAt || new Date();

        finalElapsedMs = Math.max(
          0,
          stoppedAt.getTime() -
          startedAt.getTime() -
          (rawTimer.pausedDuration || 0)
        );
      }
    }

    await TimerState.collection.updateOne(
      { _id: rawTimer._id },
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

    rawTimer = await TimerState.collection.findOne({
      _id: rawTimer._id
    });
  } else if (!rawTimer.key) {
    await TimerState.collection.updateOne(
      { _id: rawTimer._id },
      { $set: { key: 'global' } }
    );
  }

  return await TimerState.findById(rawTimer._id);
}
