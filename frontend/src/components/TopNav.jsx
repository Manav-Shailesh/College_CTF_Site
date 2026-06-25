import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchResource } from '../api/flags.js';

export default function TopNav() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [driveLink, setDriveLink] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchResource(token)
      .then((data) => setDriveLink(data.driveLink || ''))
      .catch(() => {});
  }, [token]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = 'text-noxAsh hover:text-noxWhite transition-colors';

  return (
    <nav className="flex justify-center gap-5 mb-7 text-xs tracking-widest uppercase flex-wrap font-mono">
      <Link to="/" className={linkClass}>Home</Link>
      <Link to="/leaderboard" className={linkClass}>Leaderboard</Link>
      {token && user ? (
        <>
          <Link to="/terminal" className={linkClass}>Terminal</Link>
          {driveLink && (
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-noxRed hover:text-noxWhite transition-colors flex items-center gap-1"
            >
              ⬡ Resources
            </a>
          )}
          <span className="text-noxWhite">{user.username}</span>
          <button
            onClick={handleLogout}
            className={`${linkClass} bg-transparent border-none cursor-pointer font-mono`}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className={linkClass}>Log in</Link>
          <Link to="/register" className={linkClass}>Register</Link>
        </>
      )}
    </nav>
  );
}