import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NoxLogo from '../components/NoxLogo.jsx';
import TopNav from '../components/TopNav.jsx';
import { registerUser } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full bg-black/40 border border-white/15 text-noxWhite font-mono text-sm px-4 py-3 rounded-md focus:outline-none focus:border-noxRed focus:ring-2 focus:ring-noxRed/20 transition-colors';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function getPasswordIssue(password, username, email) {
  if (!password) return null;
  if (!PASSWORD_RULE.test(password)) {
    return 'Needs 8+ characters, an uppercase letter, a lowercase letter, a number, and a special character.';
  }
  const lowerPw = password.toLowerCase();
  const localPart = email.split('@')[0]?.toLowerCase() || '';
  if (username && lowerPw.includes(username.trim().toLowerCase())) {
    return 'Password cannot contain your username.';
  }
  if (localPart && lowerPw.includes(localPart)) {
    return 'Password cannot contain the part of your email before the @.';
  }
  return null;
}

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loginAs } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const passwordIssue = getPasswordIssue(form.password, form.username, form.email);
  const usernameMatchesEmail =
    form.username.trim() && form.email.trim() && form.username.trim().toLowerCase() === form.email.trim().toLowerCase();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (usernameMatchesEmail) {
      setError('Username and email cannot be the same.');
      return;
    }
    if (passwordIssue) {
      setError(passwordIssue);
      return;
    }

    setSubmitting(true);
    try {
      const data = await registerUser(form);
      loginAs(data.token, data.user);
      navigate('/terminal');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 font-mono text-noxWhite">
      <TopNav />
      <header className="text-center mb-10">
        <NoxLogo />
        <h1 className="text-5xl font-bold tracking-[0.35em] mt-3 mb-1" style={{ textShadow: '0 0 18px rgba(226,35,26,0.45)' }}>
          NOX
        </h1>
        <p className="text-noxAsh text-xs tracking-[0.25em] uppercase">Create your dossier</p>
      </header>

      <div className="max-w-md mx-auto bg-noxPanel border border-white/10 rounded-lg p-8">
        <h2 className="text-xl tracking-wider text-center font-bold mb-1">REGISTER</h2>
        <p className="text-center text-noxAsh text-sm mb-7">Christ University email required</p>

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
              minLength={3}
              className={inputClass}
            />
            {usernameMatchesEmail && (
              <p className="text-noxRed text-xs mt-1.5">Username and email cannot be the same.</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-xs tracking-wider uppercase text-noxAsh mb-2">
              Christ University email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="yourname@christuniversity.in"
              value={form.email}
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
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className={inputClass}
            />
            <p className={`text-xs mt-1.5 ${passwordIssue ? 'text-noxRed' : 'text-noxAsh'}`}>
              {passwordIssue ||
                (form.password
                  ? 'Looks good: 8+ chars with upper, lower, number, and special character.'
                  : 'At least 8 characters, with uppercase, lowercase, a number, and a special character.')}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-br from-noxRed to-noxRedDim text-noxWhite font-bold tracking-wider text-sm px-6 py-3 rounded-md shadow-noxGlow hover:shadow-noxGlowLg disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            {submitting ? 'CREATING ACCOUNT...' : 'REGISTER'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-noxAsh">
          Already registered?{' '}
          <Link to="/login" className="text-noxRed underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}