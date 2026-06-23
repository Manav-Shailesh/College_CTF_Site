import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NoxLogo from '../components/NoxLogo.jsx';
import { fetchAdminOverview } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';

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

export default function AdminDashboard() {
  const { adminToken, adminLogout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminOverview(adminToken)
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminToken]);

  function handleLogout() {
    adminLogout();
    navigate('/admin/login');
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-5 py-12 font-mono text-noxWhite">
      <nav className="flex justify-center gap-5 mb-7 text-xs tracking-widest uppercase">
        <span className="text-noxWhite">Admin Overview</span>
        <button onClick={handleLogout} className="text-noxAsh hover:text-noxWhite transition-colors bg-transparent border-none cursor-pointer font-mono">
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

      <main className="bg-noxPanel border border-white/10 rounded-lg p-8">
        {loading && <p className="text-center text-noxAsh py-8 text-sm">Loading overview...</p>}
        {error && (
          <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[720px]">
              <thead>
                <tr>
                  {['#', 'Username', 'Email', 'Solved', 'Progress', 'Time taken', 'Completed at'].map((h) => (
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
                  <tr key={u.email}>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">{idx + 1}</td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">{u.username}</td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">{u.email}</td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">{u.solvedCount} / 7</td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">
                      {SIN_ORDER.map((sin) => (
                        <span
                          key={sin}
                          title={sin}
                          className={`inline-block w-4.5 h-4.5 rounded-sm border mr-0.5
                            ${u.progress?.[sin]?.solved ? 'bg-noxRed border-noxRed' : 'border-white/10'}`}
                        />
                      ))}
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">
                      {formatDuration(u.timeTakenMs)}
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-white/10 whitespace-nowrap">
                      {u.completedAt ? new Date(u.completedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}