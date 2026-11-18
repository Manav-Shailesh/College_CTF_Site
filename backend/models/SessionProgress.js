import mongoose from 'mongoose';

const SIN_KEYS = [
  'pride',
  'greed',
  'wrath',
  'sloth',
  'envy',
  'gluttony',
  'lust'
];

const sinProgressSchema = new mongoose.Schema(
  {
    solved: {
      type: Boolean,
      default: false
    },
    solvedAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const sessionProgressSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameSession',
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Preserve player identity for archived competition records.
    usernameSnapshot: {
      type: String,
      required: true
    },

    emailSnapshot: {
      type: String,
      required: true
    },

    progress: {
      type: Map,
      of: sinProgressSchema,
      default: () =>
        new Map(
          SIN_KEYS.map((key) => [
            key,
            {
              solved: false,
              solvedAt: null,
              attempts: 0
            }
          ])
        )
    },

    firstSolveAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    completionTimeMs: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
);

sessionProgressSchema.index(
  { sessionId: 1, userId: 1 },
  { unique: true }
);

sessionProgressSchema.index({
  sessionId: 1,
  completedAt: 1,
  completionTimeMs: 1
});

export const SESSION_SINS = SIN_KEYS;

export default mongoose.model('SessionProgress', sessionProgressSchema);