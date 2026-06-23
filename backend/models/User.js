import mongoose from 'mongoose';

const SIN_KEYS = ['pride', 'greed', 'wrath', 'sloth', 'envy', 'gluttony', 'lust'];

const sinProgressSchema = new mongoose.Schema(
  {
    solved: { type: Boolean, default: false },
    solvedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {type: String,required: true,unique: true,trim: true,minlength: 3,maxlength: 30},
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstSolveAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    progress: {
      type: Map,
      of: sinProgressSchema,
      default: () =>
        new Map(SIN_KEYS.map((key) => [key, { solved: false, solvedAt: null, attempts: 0 }]))
    }
  },
  { timestamps: true }
);

userSchema.index({ completedAt: 1 });

export const SINS = SIN_KEYS;
export default mongoose.model('User', userSchema);