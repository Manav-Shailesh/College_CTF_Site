
import mongoose from 'mongoose';

const timerStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      immutable: true
    },

    state: {
      type: String,
      enum: ['NOT_STARTED', 'RUNNING', 'STOPPED'],
      default: 'NOT_STARTED',
      required: true
    },

    startedAt: {
      type: Date,
      default: null
    },

    stoppedAt: {
      type: Date,
      default: null
    },

    finalElapsedMs: {
      type: Number,
      default: 0
    },

    // Incremented by each submission transaction.
    // This serializes submissions against Stop.
    submissionSequence: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('TimerState', timerStateSchema);
