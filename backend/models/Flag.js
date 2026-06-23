import mongoose from 'mongoose';

const flagSchema = new mongoose.Schema({
  sin: {
    type: String,
    required: true,
    unique: true,
    enum: ['pride', 'greed', 'wrath', 'sloth', 'envy', 'gluttony', 'lust']
  },
  label: { type: String, required: true },
  answerHash: { type: String, required: true }
});

export default mongoose.model('Flag', flagSchema);