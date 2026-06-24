import { useEffect, useState } from 'react';
import NoxLogo from '../components/NoxLogo.jsx';
import TopNav from '../components/TopNav.jsx';
import { fetchLeaderboard } from '../api/admin.js';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard()
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">
      <TopNav />
      <header className="text-center mb-10">
        <NoxLogo />
        <h1 className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1" style={{ textShadow: '0 0 18px rgba(226,35,26,0.45)' }}>
          NOX
        </h1>
        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">Leaderboard // Fastest Completions</p>
      </header>

      <main className="bg-noxPanel border border-white/10 rounded-lg p-8">
        {loading && <p className="text-center text-noxAsh py-8 text-sm">Loading leaderboard...</p>}
        {error && (
          <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <p className="text-center text-noxAsh py-10 text-sm">
            No one has completed all seven flags yet. Be the first.
          </p>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Rank', 'Username', 'Time taken', 'Completed'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-noxAsh text-[0.68rem] tracking-wider uppercase px-3 py-2.5 border-b border-white/10"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className={entry.isTopThree ? 'bg-noxRed/[0.06]' : ''}>
                  <td className="px-3 py-3 border-b border-white/10">
                    <span
                      className={`inline-flex items-center justify-center w-6.5 h-6.5 rounded-full border text-xs font-bold
                        ${entry.isTopThree ? 'border-noxRed text-noxRed shadow-[0_0_10px_rgba(226,35,26,0.35)]' : 'border-white/10'}`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-white/10">{entry.username}</td>
                  <td className="px-3 py-3 border-b border-white/10">{formatDuration(entry.timeTakenMs)}</td>
                  <td className="px-3 py-3 border-b border-white/10">
                    {new Date(entry.completedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className="text-center mt-12 pt-5 border-t border-white/10 text-noxAsh text-xs leading-relaxed">
        <p><strong className="text-noxWhite tracking-wider">NOX</strong> — ranked by total time taken.</p>
      </footer>
    </div>
  );
}
