
import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    sessionNumber: {
      type: Number,
      required: true,
      unique: true
    },

    state: {
      type: String,
      enum: ['NOT_STARTED', 'RUNNING', 'STOPPED'],
      default: 'NOT_STARTED',
      required: true
    },

    isCurrent: {
      type: Boolean,
      default: true,
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

    submissionSequence: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: String,
      default: 'admin'
    }
  },
  {
    timestamps: true
  }
);

// Only one current competition can exist.
gameSessionSchema.index(
  { isCurrent: 1 },
  {
    unique: true,
    partialFilterExpression: { isCurrent: true }
  }
);

// Useful for retrieving archived competitions.
gameSessionSchema.index({ sessionNumber: -1 });

export default mongoose.model('GameSession', gameSessionSchema);
