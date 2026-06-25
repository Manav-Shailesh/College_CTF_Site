import mongoose from 'mongoose';

// Single-document collection - there's only ever one resource link.
// We use findOneAndUpdate with upsert so it creates itself on first save.
const resourceSchema = new mongoose.Schema(
  {
    driveLink: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  }
);

export default mongoose.model('Resource', resourceSchema);