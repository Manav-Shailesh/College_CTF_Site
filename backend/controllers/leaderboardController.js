import User, { SINS } from '../models/User.js';

export async function getLeaderboard(req, res) {
  try {
    const finishers = await User.find({ completedAt: { $ne: null } })
      .select('username firstSolveAt completedAt')
      .lean();

    const ranked = finishers
      .map((u) => ({
        username: u.username,
        completedAt: u.completedAt,
        timeTakenMs: new Date(u.completedAt) - new Date(u.firstSolveAt)
      }))
      .sort((a, b) => a.timeTakenMs - b.timeTakenMs)
      .map((entry, index) => ({ rank: index + 1, ...entry, isTopThree: index < 3 }));

    return res.json({ leaderboard: ranked });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ message: 'Could not load the leaderboard.' });
  }
}

export async function getAdminOverview(req, res) {
  try {
    const users = await User.find({})
      .select('username email progress firstSolveAt completedAt createdAt')
      .lean();

    const rows = users.map((u) => {
      const solvedCount = SINS.filter((s) => u.progress?.[s]?.solved).length;
      const lastSolvedAt = SINS.reduce((latest, s) => {
        const t = u.progress?.[s]?.solvedAt;
        if (!t) return latest;
        return !latest || new Date(t) > new Date(latest) ? t : latest;
      }, null);

      return {
        username: u.username,
        email: u.email,
        registeredAt: u.createdAt,
        solvedCount,
        progress: u.progress,
        firstSolveAt: u.firstSolveAt,
        completedAt: u.completedAt,
        lastSolvedAt,
        timeTakenMs:
          u.completedAt && u.firstSolveAt ? new Date(u.completedAt) - new Date(u.firstSolveAt) : null
      };
    });

    rows.sort((a, b) => {
      if (a.completedAt && b.completedAt) return a.timeTakenMs - b.timeTakenMs;
      if (a.completedAt) return -1;
      if (b.completedAt) return 1;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (!a.lastSolvedAt) return 1;
      if (!b.lastSolvedAt) return -1;
      return new Date(a.lastSolvedAt) - new Date(b.lastSolvedAt);
    });

    return res.json({ users: rows });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ message: 'Could not load admin overview.' });
  }
}