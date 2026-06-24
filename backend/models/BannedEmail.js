import mongoose from 'mongoose';

const bannedEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    bannedAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default mongoose.model('BannedEmail', bannedEmailSchema);