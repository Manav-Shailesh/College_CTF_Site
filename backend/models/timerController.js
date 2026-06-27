import TimerState from '../models/TimerState.js';
import User from '../models/User.js';

async function getOrCreateTimer() {
  let timer = await TimerState.findOne({});
  if (!timer) {
    timer = await TimerState.create({});
  }
  return timer;
}

export async function getTimer(req, res) {
  try {
    const timer = await getOrCreateTimer();
    const elapsedMs = timer.isRunning && timer.startTime
      ? Date.now() - timer.startTime.getTime() - timer.pausedDuration
      : 0;

    return res.json({
      isRunning: timer.isRunning,
      isPaused: timer.isPaused,
      startTime: timer.startTime,
      pausedDuration: timer.pausedDuration,
      elapsedMs
    });
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch timer.' });
  }
}

export async function startTimer(req, res) {
  try {
    let timer = await getOrCreateTimer();
    timer.isRunning = true;
    timer.isPaused = false;
    timer.startTime = new Date();
    timer.pausedDuration = 0;
    timer.updatedAt = new Date();
    await timer.save();

    return res.json({ message: 'Timer started.', isRunning: true });
  } catch (err) {
    return res.status(500).json({ message: 'Could not start timer.' });
  }
}

export async function stopTimer(req, res) {
  try {
    const timer = await getOrCreateTimer();
    timer.isRunning = false;
    timer.isPaused = false;
    timer.updatedAt = new Date();
    await timer.save();

    return res.json({ message: 'Timer stopped. Flag submissions are now closed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not stop timer.' });
  }
}

export async function pauseTimer(req, res) {
  try {
    const timer = await getOrCreateTimer();
    if (!timer.isRunning) {
      return res.status(400).json({ message: 'Timer is not running.' });
    }

    timer.isRunning = false;
    timer.isPaused = true;
    timer.updatedAt = new Date();
    await timer.save();

    return res.json({ message: 'Timer paused. Participants cannot submit flags.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not pause timer.' });
  }
}

export async function continueTimer(req, res) {
  try {
    const timer = await getOrCreateTimer();
    if (!timer.isPaused) {
      return res.status(400).json({ message: 'Timer is not paused.' });
    }

    timer.isRunning = true;
    timer.isPaused = false;
    timer.updatedAt = new Date();
    await timer.save();

    return res.json({ message: 'Timer resumed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not resume timer.' });
  }
}

export async function resetTimer(req, res) {
  try {
    // Reset timer
    const timer = await getOrCreateTimer();
    timer.isRunning = false;
    timer.isPaused = false;
    timer.startTime = null;
    timer.pausedDuration = 0;
    timer.updatedAt = new Date();
    await timer.save();

    // Clear all user progress
    await User.updateMany(
      {},
      {
        progress: {
          pride: { solved: false, solvedAt: null, attempts: 0 },
          greed: { solved: false, solvedAt: null, attempts: 0 },
          wrath: { solved: false, solvedAt: null, attempts: 0 },
          sloth: { solved: false, solvedAt: null, attempts: 0 },
          envy: { solved: false, solvedAt: null, attempts: 0 },
          gluttony: { solved: false, solvedAt: null, attempts: 0 },
          lust: { solved: false, solvedAt: null, attempts: 0 }
        },
        solvedCount: 0,
        firstSolveAt: null,
        completedAt: null,
        completionTime: null
      }
    );

    return res.json({ message: 'Timer reset. All user progress cleared.' });
  } catch (err) {
    console.error('Reset timer error:', err);
    return res.status(500).json({ message: 'Could not reset timer.' });
  }
}