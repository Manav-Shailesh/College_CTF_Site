import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NoxLogo from '../components/NoxLogo.jsx';
import { adminLogin } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full bg-black/40 border border-white/15 text-noxWhite font-mono text-sm px-4 py-3 rounded-md focus:outline-none focus:border-noxRed focus:ring-2 focus:ring-noxRed/20 transition-colors';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await adminLogin(form);
      loginAsAdmin(data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">
      <header className="text-center mb-10">
        <NoxLogo />
        <h1 className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1" style={{ textShadow: '0 0 18px rgba(226,35,26,0.45)' }}>
          NOX
        </h1>
        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">Administrator Access</p>
      </header>

      <div className="max-w-md mx-auto bg-noxPanel border border-white/10 rounded-lg p-8">
        <h2 className="text-xl tracking-wider text-center font-bold mb-1">ADMIN LOGIN</h2>
        <p className="text-center text-noxAsh text-sm mb-7">Restricted area</p>

        {error && (
          <div className="bg-noxRed/10 border border-noxRed text-noxWhite text-sm px-4 py-3 rounded-md mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-xs tracking-wider uppercase text-noxAsh mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs tracking-wider uppercase text-noxAsh mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-br from-noxRed to-noxRedDim text-noxWhite font-bold tracking-wider text-sm px-6 py-3 rounded-md shadow-noxGlow hover:shadow-noxGlowLg disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {submitting ? 'VERIFYING...' : 'LOG IN'}
          </button>
        </form>
      </div>
    </div>
  );
}