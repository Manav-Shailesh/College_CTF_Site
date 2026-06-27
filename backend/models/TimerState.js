import mongoose from 'mongoose';

const timerStateSchema = new mongoose.Schema(
  {
    isRunning: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    startTime: { type: Date, default: null },
    pausedDuration: { type: Number, default: 0 }, // Total ms paused
    updatedAt: { type: Date, default: Date.now }
  }
);

export default mongoose.model('TimerState', timerStateSchema);