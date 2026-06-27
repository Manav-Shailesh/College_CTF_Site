import { useEffect, useMemo, useState, useContext } from 'react';
import NoxLogo from '../components/NoxLogo.jsx';
import TopNav from '../components/TopNav.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TimerContext } from '../context/TimerContext.jsx';
import { fetchProgress, submitFlag } from '../api/flags.js';

const SIN_META = [
  { key: 'pride', label: 'Pride', icon: '♔', desc: 'Submit the flag tied to the sin of Pride to clear this dossier.' },
  { key: 'greed', label: 'Greed', icon: '◈', desc: 'Submit the flag tied to the sin of Greed to clear this dossier.' },
  { key: 'wrath', label: 'Wrath', icon: '▲', desc: 'Submit the flag tied to the sin of Wrath to clear this dossier.' },
  { key: 'sloth', label: 'Sloth', icon: '☾', desc: 'Submit the flag tied to the sin of Sloth to clear this dossier.' },
  { key: 'envy', label: 'Envy', icon: '◉', desc: 'Submit the flag tied to the sin of Envy to clear this dossier.' },
  { key: 'gluttony', label: 'Gluttony', icon: '◍', desc: 'Submit the flag tied to the sin of Gluttony to clear this dossier.' },
  { key: 'lust', label: 'Lust', icon: '♡', desc: 'Submit the flag tied to the sin of Lust to clear this dossier.' }
];

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${paddedMins}:${paddedSecs}` : `${paddedMins}:${paddedSecs}`;
}

export default function Terminal() {
  const { token } = useAuth();
  const timerState = useContext(TimerContext);
  const [activeTab, setActiveTab] = useState('pride');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [feedback, setFeedback] = useState({});
  const [shaking, setShaking] = useState({});
  const [verifying, setVerifying] = useState({});

  useEffect(() => {
    fetchProgress(token)
      .then((data) => setProgress(data.progress))
      .catch(() => setProgress({}))
      .finally(() => setLoading(false));
  }, [token]);

  const solvedCount = useMemo(() => {
    if (!progress) return 0;
    return SIN_META.filter((s) => progress[s.key]?.solved).length;
  }, [progress]);

  function handleInputChange(sin, value) {
    setInputs((prev) => ({ ...prev, [sin]: value }));
  }

  async function handleValidate(sin) {
    // Check if timer is running
    if (!timerState.isRunning) {
      setFeedback((prev) => ({
        ...prev,
        [sin]: {
          type: 'error',
          message: timerState.isPaused
            ? '⏸ TIMER IS PAUSED. SUBMISSIONS ARE BLOCKED.'
            : '⭘ TIMER HAS NOT STARTED. SUBMISSIONS ARE NOT ALLOWED.'
        }
      }));
      return;
    }

    const candidate = (inputs[sin] || '').trim();
    if (!candidate) {
      setFeedback((prev) => ({ ...prev, [sin]: { type: 'error', message: '⚠ ENTER A FLAG BEFORE VALIDATING.' } }));
      return;
    }

    setVerifying((prev) => ({ ...prev, [sin]: true }));
    try {
      const result = await submitFlag(sin, candidate, token);
      if (result.correct) {
        setProgress((prev) => ({
          ...prev,
          [sin]: { ...(prev?.[sin] || {}), solved: true, solvedAt: new Date().toISOString() }
        }));
        setFeedback((prev) => ({ ...prev, [sin]: { type: 'success', message: '✓ ' + result.message.toUpperCase() } }));
        // Clear input on success
        setInputs((prev) => ({ ...prev, [sin]: '' }));
      } else {
        setShaking((prev) => ({ ...prev, [sin]: true }));
        setFeedback((prev) => ({ ...prev, [sin]: { type: 'error', message: '✗ ' + result.message.toUpperCase() } }));
        setTimeout(() => setShaking((prev) => ({ ...prev, [sin]: false })), 400);
      }
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [sin]: { type: 'error', message: '⚠ ' + err.message.toUpperCase() } }));
    } finally {
      setVerifying((prev) => ({ ...prev, [sin]: false }));
    }
  }

  if (loading) {
    return (
      <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">
        <TopNav />
        <p className="text-center text-noxAsh py-8 text-sm">Loading your dossier...</p>
      </div>
    );
  }

  const activeMeta = SIN_META.find((s) => s.key === activeTab);
  const activeProgress = progress?.[activeTab];

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">
      <TopNav />

      <header className="text-center mb-10">
        <NoxLogo />
        <h1 className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1" style={{ textShadow: '0 0 18px rgba(226,35,26,0.45)' }}>
          NOX
        </h1>
        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">
          Seven Deadly Sins // Flag Validation Terminal
        </p>
      </header>

      {/* Timer Display Panel */}
      <div className="bg-noxPanel border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-noxAsh mb-1">ELAPSED TIME</p>
            <p className="text-3xl font-bold text-noxWhite font-mono" style={{ textShadow: '0 0 8px rgba(226,35,26,0.4)' }}>
              {formatTime(timerState.elapsedMs)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-noxAsh mb-1">STATUS</p>
            <p
              className={`text-sm font-bold uppercase tracking-wider ${
                timerState.isRunning
                  ? 'text-noxRed'
                  : timerState.isPaused
                  ? 'text-[#f0a030]'
                  : 'text-noxAsh'
              }`}
            >
              {timerState.isRunning
                ? '⬤ Running'
                : timerState.isPaused
                ? '⏸ Paused'
                : '⭘ Waiting to Start'}
            </p>
          </div>
        </div>
      </div>

      {/* Warning if timer not running */}
      {!timerState.isRunning && (
        <div className="bg-[#333]/50 border border-noxAsh/30 rounded-lg p-4 mb-6 text-center">
          <p className="text-noxAsh text-sm">
            {timerState.isPaused
              ? '⏸ Timer is paused. Waiting for admin to resume...'
              : '⭘ Waiting for admin to start the timer. Flag submissions are disabled.'}
          </p>
        </div>
      )}

      {/* Progress Counter */}
      <div className="max-w-md mx-auto mt-8">
        <div className="text-center text-xs tracking-wider text-noxAsh uppercase mb-2">
          <span className="text-noxWhite font-bold">{solvedCount}</span> / 7 SINS CONQUERED
        </div>
        <div className="h-1.5 rounded-full bg-[#161616] border border-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-noxRedDim to-noxRed transition-all duration-500"
            style={{ width: `${(solvedCount / 7) * 100}%`, boxShadow: '0 0 10px rgba(226,35,26,0.45)' }}
          />
        </div>
      </div>

      {/* Sin Tabs */}
      <nav className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-8" role="tablist" aria-label="Sin selection">
        {SIN_META.map((sin) => {
          const isSolved = progress?.[sin.key]?.solved;
          const isActive = sin.key === activeTab;
          return (
            <button
              key={sin.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(sin.key)}
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
              className={`relative flex flex-col items-center gap-1 py-3.5 px-1.5 text-[0.68rem] tracking-wider uppercase border transition-all
                ${isActive
                  ? 'bg-[#151012] border-noxRed text-noxWhite shadow-[0_0_16px_rgba(226,35,26,0.25)_inset]'
                  : 'bg-[#0d0d0e] border-white/10 text-noxAsh hover:text-noxWhite hover:border-noxRed/40'}
                ${isSolved && !isActive ? 'text-noxRed' : ''}`}
            >
              {isSolved && (
                <span className="absolute top-1 right-2 text-[0.65rem] text-noxRed">✓</span>
              )}
              <span className="text-xl leading-none" aria-hidden="true">
                {sin.icon}
              </span>
              {sin.label.toUpperCase()}
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="bg-noxPanel border border-white/10 border-t-0 rounded-b-lg p-8">
        <section className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-2xl text-noxRed" style={{ textShadow: '0 0 12px rgba(226,35,26,0.45)' }} aria-hidden="true">
              {activeMeta.icon}
            </span>
            <h2 className="text-lg tracking-[0.18em] font-bold flex-1">{activeMeta.label.toUpperCase()}</h2>
            <span
              style={{ transform: 'rotate(-6deg)' }}
              className={`inline-block border-2 px-2.5 py-1 text-[0.62rem] font-bold tracking-wider rounded
                ${activeProgress?.solved
                  ? 'border-noxRed text-noxRed shadow-[0_0_10px_rgba(226,35,26,0.5)]'
                  : 'border-noxAsh text-noxAsh'}`}
            >
              {activeProgress?.solved ? 'SOLVED' : 'LOCKED'}
            </span>
          </div>
          <p className="text-noxAsh text-sm leading-relaxed my-5">{activeMeta.desc}</p>

          <div className="flex gap-2.5 flex-wrap">
            <input
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder={`ENTER FLAG FOR ${activeMeta.label.toUpperCase()}...`}
              value={inputs[activeTab] || ''}
              disabled={activeProgress?.solved || !timerState.isRunning}
              onChange={(e) => handleInputChange(activeTab, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleValidate(activeTab);
                }
              }}
              onAnimationEnd={() => setShaking((prev) => ({ ...prev, [activeTab]: false }))}
              className={`flex-1 min-w-[240px] bg-black/40 border text-noxWhite font-mono text-sm px-4 py-3.5 rounded-md
                focus:outline-none focus:ring-2 focus:ring-noxRed/20 transition-colors
                ${activeProgress?.solved ? 'border-noxRed bg-noxRed/5' : timerState.isRunning ? 'border-white/15 focus:border-noxRed' : 'border-white/15 bg-black/60 opacity-50'}
                ${shaking[activeTab] ? 'animate-shake' : ''}`}
            />
            <button
              disabled={verifying[activeTab] || activeProgress?.solved || !timerState.isRunning}
              onClick={() => handleValidate(activeTab)}
              className={`font-bold tracking-wider text-xs px-6 py-3.5 rounded-md transition-all whitespace-nowrap ${
                timerState.isRunning
                  ? 'bg-gradient-to-br from-noxRed to-noxRedDim text-noxWhite shadow-noxGlow hover:shadow-noxGlowLg disabled:opacity-60'
                  : 'bg-[#333] text-noxAsh cursor-not-allowed opacity-50'
              }`}
            >
              {verifying[activeTab]
                ? 'VERIFYING...'
                : activeProgress?.solved
                ? 'VERIFIED'
                : timerState.isRunning
                ? 'VALIDATE'
                : 'WAITING FOR TIMER'}
            </button>
          </div>

          {feedback[activeTab] && (
            <div
              className={`mt-4 px-4 py-3 rounded-md text-sm leading-relaxed border
                ${feedback[activeTab].type === 'success'
                  ? 'bg-noxRed/10 border-noxRed text-noxWhite shadow-[0_0_16px_rgba(226,35,26,0.25)]'
                  : 'bg-white/5 border-white/15 text-[#cfcdc9]'}`}
            >
              {feedback[activeTab].message}
            </div>
          )}
        </section>
      </main>

      <footer className="text-center mt-12 pt-5 border-t border-white/10 text-noxAsh text-xs leading-relaxed">
        <p>
          <strong className="text-noxWhite tracking-wider">NOX</strong> — CTF
        </p>
      </footer>
    </div>
  );
}