
import mongoose from 'mongoose';

import User, { SINS } from '../models/User.js';
import GameSession from '../models/GameSession.js';
import SessionProgress from '../models/SessionProgress.js';

function emptyProgress() {
  return Object.fromEntries(
    SINS.map((sin) => [
      sin,
      {
        solved: false,
        solvedAt: null,
        attempts: 0
      }
    ])
  );
}

function normalizeProgress(progress) {
  const result = {};

  for (const sin of SINS) {
    let entry;

    if (progress instanceof Map) {
      entry = progress.get(sin);
    } else {
      entry = progress?.[sin];
    }

    result[sin] = entry
      ? {
          solved: Boolean(entry.solved),
          solvedAt: entry.solvedAt || null,
          attempts: entry.attempts || 0
        }
      : {
          solved: false,
          solvedAt: null,
          attempts: 0
        };
  }

  return result;
}

async function getRequestedSession(req) {
  const { sessionId } = req.query;

  if (sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return { error: 'Invalid session ID.', status: 400 };
    }

    const selectedSession = await GameSession.findById(sessionId);

    if (!selectedSession) {
      return { error: 'Competition session not found.', status: 404 };
    }

    return { selectedSession };
  }

  const selectedSession = await GameSession.findOne({
    isCurrent: true
  });

  return { selectedSession };
}

export async function getLeaderboard(req, res) {
  try {
    const { selectedSession, error, status } =
      await getRequestedSession(req);

    if (error) {
      return res.status(status).json({ message: error });
    }

    if (!selectedSession) {
      return res.json({
        leaderboard: [],
        sessionId: null,
        sessionName: null,
        sessionState: null
      });
    }

    const finishers = await SessionProgress.find({
      sessionId: selectedSession._id,
      completedAt: { $ne: null }
    })
      .select(
        'usernameSnapshot completedAt completionTimeMs'
      )
      .lean();

    const ranked = finishers
      .map((entry) => ({
        username: entry.usernameSnapshot,
        completedAt: entry.completedAt,
        timeTakenMs: entry.completionTimeMs
      }))
      .sort((a, b) => {
        const timeDifference =
          (a.timeTakenMs ?? Number.MAX_SAFE_INTEGER) -
          (b.timeTakenMs ?? Number.MAX_SAFE_INTEGER);

        if (timeDifference !== 0) {
          return timeDifference;
        }

        return (
          new Date(a.completedAt).getTime() -
          new Date(b.completedAt).getTime()
        );
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        isTopThree: index < 3
      }));

    return res.json({
      leaderboard: ranked,
      sessionId: selectedSession._id,
      sessionName: selectedSession.name,
      sessionState: selectedSession.state
    });

  } catch (err) {
    console.error('Leaderboard error:', err);

    return res.status(500).json({
      message: 'Could not load the leaderboard.'
    });
  }
}

export async function getAdminOverview(req, res) {
  try {
    const { selectedSession, error, status } =
      await getRequestedSession(req);

    if (error) {
      return res.status(status).json({ message: error });
    }

    const users = await User.find({})
      .select('username email createdAt')
      .lean();

    if (!selectedSession) {
      const rows = users.map((user) => ({
        username: user.username,
        email: user.email,
        registeredAt: user.createdAt,
        solvedCount: 0,
        progress: emptyProgress(),
        firstSolveAt: null,
        completedAt: null,
        lastSolvedAt: null,
        timeTakenMs: null
      }));

      return res.json({
        users: rows,
        sessionId: null,
        sessionName: null,
        sessionState: null
      });
    }

    const sessionRecords = await SessionProgress.find({
      sessionId: selectedSession._id
    }).lean();

    const recordsByUserId = new Map(
      sessionRecords.map((record) => [
        String(record.userId),
        record
      ])
    );

    const userIds = new Set(
      users.map((user) => String(user._id))
    );

    const rows = users.map((user) => {
      const record = recordsByUserId.get(String(user._id));
return buildAdminRow({
  username: record?.usernameSnapshot || user.username,
  email: record?.emailSnapshot || user.email,
  registeredAt: user.createdAt,
  record
});
    });

    // Keep archived competition records visible even if an account
    // has subsequently been deleted.
    for (const record of sessionRecords) {
      if (userIds.has(String(record.userId))) {
        continue;
      }

      rows.push(
        buildAdminRow({
          username: record.usernameSnapshot,
          email: record.emailSnapshot,
          registeredAt: null,
          record
        })
      );
    }

    rows.sort((a, b) => {
      if (a.completedAt && b.completedAt) {
        return (a.timeTakenMs ?? Infinity) -
          (b.timeTakenMs ?? Infinity);
      }

      if (a.completedAt) return -1;
      if (b.completedAt) return 1;

      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }

    if (!a.lastSolvedAt && !b.lastSolvedAt) return 0;
if (!a.lastSolvedAt) return 1;
if (!b.lastSolvedAt) return -1;

return (
  new Date(a.lastSolvedAt).getTime() -
  new Date(b.lastSolvedAt).getTime()
);

    });

    return res.json({
      users: rows,
      sessionId: selectedSession._id,
      sessionName: selectedSession.name,
      sessionState: selectedSession.state
    });

  } catch (err) {
    console.error('Admin overview error:', err);

    return res.status(500).json({
      message: 'Could not load admin overview.'
    });
  }
}

function buildAdminRow({
  username,
  email,
  registeredAt,
  record
}) {
  const progress = normalizeProgress(record?.progress);

  const solvedCount = SINS.filter(
    (sin) => progress[sin].solved
  ).length;

  const lastSolvedAt = SINS.reduce((latest, sin) => {
    const solvedAt = progress[sin].solvedAt;

    if (!solvedAt) return latest;

    return !latest || new Date(solvedAt) > new Date(latest)
      ? solvedAt
      : latest;
  }, null);

  return {
    username,
    email,
    registeredAt,
    solvedCount,
    progress,
    firstSolveAt: record?.firstSolveAt || null,
    completedAt: record?.completedAt || null,
    lastSolvedAt,
    timeTakenMs: record?.completionTimeMs ?? null
  };
}
