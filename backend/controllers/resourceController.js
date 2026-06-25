import Resource from '../models/Resource.js';

export async function getResource(req, res) {
  try {
    const resource = await Resource.findOne({});
    return res.json({ driveLink: resource?.driveLink || '' });
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch resource link.' });
  }
}

export async function setResource(req, res) {
  try {
    const { driveLink } = req.body;
    if (!driveLink || !driveLink.trim()) {
      return res.status(400).json({ message: 'A Google Drive link is required.' });
    }

    const trimmed = driveLink.trim();

    // Basic sanity check - must at least look like a Google Drive URL
    if (!trimmed.includes('drive.google.com') && !trimmed.includes('docs.google.com')) {
      return res.status(400).json({ message: 'Please enter a valid Google Drive link.' });
    }

    const resource = await Resource.findOneAndUpdate(
      {},
      { driveLink: trimmed, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ driveLink: resource.driveLink });
  } catch (err) {
    return res.status(500).json({ message: 'Could not save resource link.' });
  }
}