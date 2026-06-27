import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NoxLogo from '../components/NoxLogo.jsx';
import { fetchAdminOverview, removeUser, banUser, fetchBannedEmails, unbanUser, setResourceLink, startTimer, stopTimer, pauseTimer, continueTimer, resetTimer } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TimerContext } from '../context/TimerContext.jsx';

const SIN_ORDER = ['pride', 'greed', 'wrath', 'sloth', 'envy', 'gluttony', 'lust'];

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

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${paddedMins}:${paddedSecs}` : `${paddedMins}:${paddedSecs}`;
}

export default function AdminDashboard() {
  const { adminToken, adminLogout } = useAuth();
  const timerState = useContext(TimerContext);
  const navigate = useNavigate();

  // User management
  const [users, setUsers] = useState([]);
  const [banned, setBanned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  // Resource link
  const [driveLink, setDriveLink] = useState('');
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');

  // Timer
  const [timerMsg, setTimerMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAdminOverview(adminToken),
      fetchBannedEmails(adminToken),
      fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/flags/resource`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      ).then((r) => r.json())
    ])
      .then(([overviewData, bannedData, resourceData]) => {
        setUsers(overviewData.users);
        setBanned(bannedData.banned);
        setDriveLink(resourceData.driveLink || '');
        setDriveLinkInput(resourceData.driveLink || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminToken]);

  function handleLogout() {
    adminLogout();
    navigate('/admin/login');
  }

  function showMessage(msg) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  }

  // ========== Timer Functions ==========
  async function handleStartTimer() {
    try {
      const res = await startTimer(adminToken);
      setTimerMsg(res.message);
      setTimeout(() => setTimerMsg(''), 3000);
    } catch (err) {
      setTimerMsg('Error: ' + err.message);
    }
  }

  async function handleStopTimer() {
    try {
      const res = await stopTimer(adminToken);
      setTimerMsg(res.message);
      setTimeout(() => setTimerMsg(''), 3000);
    } catch (err) {
      setTimerMsg('Error: ' + err.message);
    }
  }

  async function handlePauseTimer() {
    try {
      const res = await pauseTimer(adminToken);
      setTimerMsg(res.message);
      setTimeout(() => setTimerMsg(''), 3000);
    } catch (err) {
      setTimerMsg('Error: ' + err.message);
    }
  }

  async function handleContinueTimer() {
    try {
      const res = await continueTimer(adminToken);
      setTimerMsg(res.message);
      setTimeout(() => setTimerMsg(''), 3000);
    } catch (err) {
      setTimerMsg('Error: ' + err.message);
    }
  }

  async function confirmAndResetTimer() {
    setConfirmReset(false);
    try {
      const res = await resetTimer(adminToken);
      setTimerMsg(res.message);
      
      // Reload overview after reset
      Promise.all([
        fetchAdminOverview(adminToken),
        fetchBannedEmails(adminToken),
        fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/flags/resource`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        ).then((r) => r.json())
      ])
        .then(([overviewData, bannedData, resourceData]) => {
          setUsers(overviewData.users);
          setBanned(bannedData.banned);
          setDriveLink(resourceData.driveLink || '');
          setDriveLinkInput(resourceData.driveLink || '');
        });

      setTimeout(() => setTimerMsg(''), 3000);
    } catch (err) {
      setTimerMsg('Error: ' + err.message);
    }
  }

  // ========== Resource Link Functions ==========
  async function handleSaveLink() {
    setLinkSaving(true);
    setLinkMsg('');
    try {
      const res = await setResourceLink(driveLinkInput, adminToken);
      setDriveLink(res.driveLink);
      setDriveLinkInput(res.driveLink);
      setLinkMsg('✓ Resource link updated successfully.');
    } catch (err) {
      setLinkMsg('Error: ' + err.message);
    } finally {
      setLinkSaving(false);
      setTimeout(() => setLinkMsg(''), 4000);
    }
  }

  // ========== User Management Functions ==========
  async function handleConfirm() {
    if (!confirming) return;
    const { email, action } = confirming;
    setConfirming(null);
    try {
      if (action === 'remove') {
        const res = await removeUser(email, adminToken);
        setUsers((prev) => prev.filter((u) => u.email !== email));
        showMessage(res.message);
      } else if (action === 'ban') {
        const res = await banUser(email, adminToken);
        setUsers((prev) => prev.filter((u) => u.email !== email));
        setBanned((prev) => [{ email, bannedAt: new Date().toISOString() }, ...prev]);
        showMessage(res.message);
      }
    } catch (err) {
      showMessage('Error: ' + err.message);
    }
  }

  async function handleUnban(email) {
    try {
      const res = await unbanUser(email, adminToken);
      setBanned((prev) => prev.filter((b) => b.email !== email));
      showMessage(res.message);
    } catch (err) {
      showMessage('Error: ' + err.message);
    }
  }

  const tabClass = (t) =>
    `px-4 py-2 text-xs tracking-widest uppercase font-mono border-b-2 transition-colors ${
      activeTab === t
        ? 'border-noxRed text-noxWhite'
        : 'border-transparent text-noxAsh hover:text-noxWhite'
    }`;

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 font-mono text-noxWhite">
      
      {/* Reset Confirmation Dialog */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-noxPanel border border-noxRed rounded-lg p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold tracking-wider mb-3 text-noxRed">RESET TIMER?</h3>
            <p className="text-noxAsh text-sm mb-6">
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset the timer to 00:00</li>
                <li>Clear all participant progress</li>
                <li>Remove all flag submissions</li>
              </ul>
              <span className="block mt-3 text-noxWhite">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAndResetTimer}
                className="flex-1 py-2.5 text-xs font-bold tracking-wider rounded-md uppercase bg-noxRed text-noxWhite hover:shadow-noxGlow transition-all"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 text-xs font-bold tracking-wider rounded-md uppercase border border-white/10 text-noxAsh hover:text-noxWhite transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Remove/Ban Confirmation Dialog */}
      {confirming && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-noxPanel border border-noxRed rounded-lg p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold tracking-wider mb-3">
              {confirming.action === 'ban' ? 'BAN USER?' : 'REMOVE USER?'}
            </h3>
            <p className="text-noxAsh text-sm mb-6">
              {confirming.action === 'ban'
                ? 'This will permanently delete the account and block the email address from registering again:'
                : 'This will permanently delete the account. The email can still re-register:'}
              <span className="block text-noxWhite mt-2 break-all">{confirming.email}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 text-xs font-bold tracking-wider rounded-md uppercase transition-all ${
                  confirming.action === 'ban'
                    ? 'bg-noxRed text-noxWhite hover:shadow-noxGlow'
                    : 'bg-[#333] text-noxWhite hover:bg-[#444]'
                }`}
              >
                {confirming.action === 'ban' ? 'Yes, ban' : 'Yes, remove'}
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 py-2.5 text-xs font-bold tracking-wider rounded-md uppercase border border-white/10 text-noxAsh hover:text-noxWhite transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="flex justify-center gap-5 mb-7 text-xs tracking-widest uppercase">
        <span className="text-noxWhite">Admin Overview</span>
        <button
          onClick={handleLogout}
          className="text-noxAsh hover:text-noxWhite transition-colors bg-transparent border-none cursor-pointer font-mono"
        >
          Log out
        </button>
      </nav>

      <header className="text-center mb-10">
        <NoxLogo />
        <h1 className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1" style={{ textShadow: '0 0 18px rgba(226,35,26,0.45)' }}>
          NOX
        </h1>
        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">
          Submission Monitoring // {users.length} Registered
        </p>
      </header>

      {/* Action Messages */}
      {actionMsg && (
        <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md mb-5 text-center">
          {actionMsg}
        </div>
      )}

      {/* Timer Control Panel */}
      <div className="bg-gradient-to-r from-noxRed/10 to-noxRedDim/5 border border-noxRed/30 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-noxAsh mb-1">Competition Timer</p>
            <p className="text-4xl font-bold text-noxWhite font-mono" style={{ textShadow: '0 0 12px rgba(226,35,26,0.5)' }}>
              {formatTime(timerState.elapsedMs)}
            </p>
            <p className="text-xs text-noxAsh mt-1">
              {timerState.isRunning
                ? '⬤ Running'
                : timerState.isPaused
                ? '⏸ Paused'
                : '⭘ Stopped'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {!timerState.isRunning && !timerState.isPaused && (
              <button
                onClick={handleStartTimer}
                className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md bg-noxRed text-noxWhite hover:shadow-noxGlowLg transition-all"
              >
                ▶ Start
              </button>
            )}
            {timerState.isRunning && (
              <>
                <button
                  onClick={handlePauseTimer}
                  className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md bg-[#666] text-noxWhite hover:bg-[#777] transition-all"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleStopTimer}
                  className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md border border-noxRed/50 text-noxRed hover:bg-noxRed/10 transition-all"
                >
                  ⏹ Stop
                </button>
              </>
            )}
            {timerState.isPaused && (
              <>
                <button
                  onClick={handleContinueTimer}
                  className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md bg-noxRed text-noxWhite hover:shadow-noxGlowLg transition-all"
                >
                  ▶ Continue
                </button>
                <button
                  onClick={handleStopTimer}
                  className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md border border-noxRed/50 text-noxRed hover:bg-noxRed/10 transition-all"
                >
                  ⏹ Stop
                </button>
              </>
            )}
            {(timerState.isRunning || timerState.isPaused || timerState.elapsedMs > 0) && (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md border border-noxRed/30 text-noxRed hover:border-noxRed/60 transition-all"
              >
                ↻ Reset
              </button>
            )}
          </div>
        </div>
        {timerMsg && (
          <p className={`text-xs mt-3 ${timerMsg.startsWith('Error') ? 'text-noxRed' : 'text-noxAsh'}`}>
            {timerMsg}
          </p>
        )}
      </div>

      {/* Resource Link Panel */}
      <div className="bg-noxPanel border border-white/10 rounded-lg p-6 mb-6">
        <h3 className="text-xs tracking-widest uppercase text-noxAsh mb-4">
          ⬡ Participant Resources — Google Drive Link
        </h3>
        {driveLink && (
          <p className="text-xs text-noxAsh mb-3">
            Current:{' '}
            <a href={driveLink} target="_blank" rel="noopener noreferrer" className="text-noxRed underline break-all">
              {driveLink}
            </a>
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <input
            type="url"
            value={driveLinkInput}
            onChange={(e) => setDriveLinkInput(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="flex-1 min-w-[280px] bg-black/40 border border-white/15 text-noxWhite font-mono text-sm px-4 py-2.5 rounded-md focus:outline-none focus:border-noxRed focus:ring-2 focus:ring-noxRed/20 transition-colors"
          />
          <button
            onClick={handleSaveLink}
            disabled={linkSaving || !driveLinkInput.trim()}
            className="px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md bg-gradient-to-br from-noxRed to-noxRedDim text-noxWhite shadow-noxGlow hover:shadow-noxGlowLg disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {linkSaving ? 'Saving...' : 'Update Link'}
          </button>
        </div>
        {linkMsg && (
          <p className={`text-xs mt-3 ${linkMsg.startsWith('Error') ? 'text-noxRed' : 'text-noxAsh'}`}>
            {linkMsg}
          </p>
        )}
      </div>

      {/* Main Content */}
      <main className="bg-noxPanel border border-white/10 rounded-lg p-8">
        {loading && <p className="text-center text-noxAsh py-8 text-sm">Loading overview...</p>}
        {error && (
          <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-white/10">
              <button className={tabClass('users')} onClick={() => setActiveTab('users')}>
                Users ({users.length})
              </button>
              <button className={tabClass('banned')} onClick={() => setActiveTab('banned')}>
                Banned ({banned.length})
              </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[820px]">
                  <thead>
                    <tr>
                      {['#', 'Username', 'Email', 'Solved', 'Progress', 'Time Taken', 'Completed at', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-noxAsh text-[0.66rem] tracking-wider uppercase px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.email} className="group">
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">{idx + 1}</td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">{u.username}</td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">{u.email}</td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">{u.solvedCount} / 7</td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">
                          {SIN_ORDER.map((sin) => (
                            <span
                              key={sin}
                              title={sin}
                              className={`inline-block w-[18px] h-[18px] rounded-sm border mr-0.5 ${
                                u.progress?.[sin]?.solved ? 'bg-noxRed border-noxRed' : 'border-white/10'
                              }`}
                            />
                          ))}
                        </td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">
                          {formatDuration(u.completionTime)}
                        </td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">
                          {u.completedAt ? new Date(u.completedAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirming({ email: u.email, action: 'remove' })}
                              className="px-3 py-1.5 text-[0.66rem] tracking-wider uppercase font-bold rounded border border-white/20 text-noxAsh hover:text-noxWhite hover:border-white/40 transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setConfirming({ email: u.email, action: 'ban' })}
                              className="px-3 py-1.5 text-[0.66rem] tracking-wider uppercase font-bold rounded border border-noxRed/40 text-noxRed hover:bg-noxRed/10 transition-colors"
                            >
                              Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Banned Tab */}
            {activeTab === 'banned' && (
              <div className="overflow-x-auto">
                {banned.length === 0 ? (
                  <p className="text-center text-noxAsh py-10 text-sm">No banned emails.</p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['#', 'Banned Email', 'Banned at', 'Action'].map((h) => (
                          <th
                            key={h}
                            className="text-left text-noxAsh text-[0.66rem] tracking-wider uppercase px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {banned.map((b, idx) => (
                        <tr key={b.email}>
                          <td className="px-2.5 py-3 border-b border-white/10">{idx + 1}</td>
                          <td className="px-2.5 py-3 border-b border-white/10">{b.email}</td>
                          <td className="px-2.5 py-3 border-b border-white/10 whitespace-nowrap">
                            {new Date(b.bannedAt).toLocaleString()}
                          </td>
                          <td className="px-2.5 py-3 border-b border-white/10">
                            <button
                              onClick={() => handleUnban(b.email)}
                              className="px-3 py-1.5 text-[0.66rem] tracking-wider uppercase font-bold rounded border border-white/20 text-noxAsh hover:text-noxWhite hover:border-white/40 transition-colors"
                            >
                              Unban
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}