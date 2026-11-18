import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import TimerState from '../models/TimerState.js';
import User from '../models/User.js';
import GameSession from '../models/GameSession.js';
import SessionProgress from '../models/SessionProgress.js';

const SINS = [
  'pride',
  'greed',
  'wrath',
  'sloth',
  'envy',
  'gluttony',
  'lust'
];

function getProgressEntry(oldProgress, sin) {
  if (oldProgress instanceof Map) {
    return oldProgress.get(sin) || {};
  }

  return oldProgress?.[sin] || {};
}

async function migrateLegacySession() {
  await connectDB();

  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {

      // Check whether the legacy migration already exists.
      const existingSession = await GameSession.findOne({
        sessionNumber: 1
      })
        .session(dbSession)
        .lean();

      if (existingSession) {
        if (existingSession.createdBy === 'legacy-migration') {
          console.log(
            'Legacy session already migrated. No changes made.'
          );
          return;
        }

        throw new Error(
          'Session number 1 is already occupied by another competition. Migration cancelled.'
        );
      }

      // Read the original timer.
      const timer = await TimerState.findOne({
        key: 'global'
      })
        .session(dbSession)
        .lean();

      if (!timer) {
        throw new Error(
          'Existing global timer was not found. Migration cancelled.'
        );
      }

      if (timer.state !== 'STOPPED') {
        throw new Error(
          `Expected STOPPED timer, found ${timer.state}. Migration cancelled.`
        );
      }

      // Read users inside the transaction.
      const users = await User.find({})
        .session(dbSession)
        .lean();

      // Create the archived legacy competition.
      const [archivedSession] = await GameSession.create(
        [
          {
            name: 'NOX CTF #1 (Legacy)',
            sessionNumber: 1,
            state: 'STOPPED',
            isCurrent: false,
            startedAt: timer.startedAt,
            stoppedAt: timer.stoppedAt,
            finalElapsedMs: timer.finalElapsedMs || 0,
            submissionSequence: timer.submissionSequence || 0,
            createdBy: 'legacy-migration'
          }
        ],
        { session: dbSession }
      );

      const progressRecords = users.map((user) => {
        const oldProgress = user.progress || {};
        const progress = {};

        for (const sin of SINS) {
          const entry = getProgressEntry(oldProgress, sin);

          progress[sin] = {
            solved: Boolean(entry.solved),
            solvedAt: entry.solvedAt || null,
            attempts: entry.attempts || 0
          };
        }

        const completionTimeMs =
          user.completedAt && timer.startedAt
            ? Math.max(
                0,
                new Date(user.completedAt).getTime() -
                  new Date(timer.startedAt).getTime()
              )
            : null;

        return {
          sessionId: archivedSession._id,
          userId: user._id,
          usernameSnapshot: user.username,
          emailSnapshot: user.email,
          progress,
          firstSolveAt: user.firstSolveAt || null,
          completedAt: user.completedAt || null,
          completionTimeMs
        };
      });

      if (progressRecords.length > 0) {
        await SessionProgress.insertMany(progressRecords, {
          session: dbSession
        });
      }

      console.log(
        `Archived legacy competition with ${progressRecords.length} player records.`
      );
    });

    console.log('Legacy migration completed.');

  } finally {
    await dbSession.endSession();
  }
}

migrateLegacySession()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Legacy migration failed:', error);

    await mongoose.disconnect();
    process.exit(1);
  });
