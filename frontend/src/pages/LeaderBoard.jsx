
import { useEffect, useState } from 'react';

import NoxLogo from '../components/NoxLogo.jsx';
import TopNav from '../components/TopNav.jsx';
import {
  fetchLeaderboard,
  fetchPublicSessions
} from '../api/admin.js';

function formatDuration(ms) {
  if (ms == null) return '—';

  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;

  return `${secs}s`;
}

export default function Leaderboard() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionState, setSessionState] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the public competition list.
  useEffect(() => {
    let cancelled = false;

    fetchPublicSessions()
      .then((data) => {
        if (cancelled) return;

        const availableSessions = data.sessions || [];

        setSessions(availableSessions);

        const currentSession = availableSessions.find(
          (session) => session.isCurrent
        );

        const defaultSession = currentSession || availableSessions[0];

        setSelectedSessionId(
          defaultSession ? defaultSession._id : ''
        );

        setSessionsLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load competitions.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load leaderboard whenever the selected competition changes.
  useEffect(() => {
    if (!sessionsLoaded) return;

    if (!selectedSessionId) {
      setLeaderboard([]);
      setSessionName('');
      setSessionState(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError('');

    fetchLeaderboard(selectedSessionId)
      .then((data) => {
        if (cancelled) return;

        setLeaderboard(data.leaderboard || []);
        setSessionName(data.sessionName || '');
        setSessionState(data.sessionState || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load leaderboard.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, sessionsLoaded]);

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">

      <TopNav />

      <header className="text-center mb-10">
        <NoxLogo />

        <h1
          className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1"
          style={{
            textShadow: '0 0 18px rgba(226,35,26,0.45)'
          }}
        >
          NOX
        </h1>

        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">
          Leaderboard // Fastest Completions
        </p>
      </header>

      <main className="bg-noxPanel border border-white/10 rounded-lg p-8">

        {/* Competition selector */}
        {sessions.length > 0 && (
          <div className="mb-6">
            <label
              htmlFor="competition-select"
              className="block text-xs text-noxAsh uppercase tracking-widest mb-2"
            >
              Select Competition
            </label>

            <select
              id="competition-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 text-sm text-noxWhite outline-none focus:border-noxRed"
            >
              {sessions.map((session) => (
                <option
                  key={session._id}
                  value={session._id}
                  className="bg-noxPanel text-noxWhite"
                >
                  {session.name}
                  {session.isCurrent ? ' (Current)' : ' (Archived)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Competition information */}
        {sessionName && (
          <div className="mb-6 text-center border-b border-white/10 pb-5">
            <p className="text-xs text-noxAsh uppercase tracking-widest mb-2">
              Competition
            </p>

            <h2 className="text-lg font-bold text-noxWhite">
              {sessionName}
            </h2>

            <p className="text-xs text-noxAsh mt-2 uppercase">
              {sessionState === 'RUNNING'
                ? 'Competition Running'
                : sessionState === 'STOPPED'
                ? 'Competition Ended'
                : 'Waiting to Start'}
            </p>
          </div>
        )}

        {loading && (
          <p className="text-center text-noxAsh py-8 text-sm">
            Loading leaderboard...
          </p>
        )}

        {error && (
          <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="text-center text-noxAsh py-10 text-sm">
            No competitions are currently available.
          </p>
        )}

        {!loading && !error && sessionName && leaderboard.length === 0 && (
          <p className="text-center text-noxAsh py-10 text-sm">
            No one has completed all seven flags yet. Be the first.
          </p>
        )}

        {!loading && !error && leaderboard.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[520px]">

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
                  <tr
                    key={entry.rank}
                    className={entry.isTopThree ? 'bg-noxRed/[0.06]' : ''}
                  >
                    <td className="px-3 py-3 border-b border-white/10">
                      <span
                        className={`inline-flex items-center justify-center w-6.5 h-6.5 rounded-full border text-xs font-bold
                          ${
                            entry.isTopThree
                              ? 'border-noxRed text-noxRed shadow-[0_0_10px_rgba(226,35,26,0.35)]'
                              : 'border-white/10'
                          }`}
                      >
                        {entry.rank}
                      </span>
                    </td>

                    <td className="px-3 py-3 border-b border-white/10">
                      {entry.username}
                    </td>

                    <td className="px-3 py-3 border-b border-white/10">
                      {formatDuration(entry.timeTakenMs)}
                    </td>

                    <td className="px-3 py-3 border-b border-white/10 whitespace-nowrap">
                      {entry.completedAt
                        ? new Date(entry.completedAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </main>

      <footer className="text-center mt-12 pt-5 border-t border-white/10 text-noxAsh text-xs leading-relaxed">
        <p>
          <strong className="text-noxWhite tracking-wider">NOX</strong>
          {' '}— ranked by total time taken.
        </p>
      </footer>

    </div>
  );
}
