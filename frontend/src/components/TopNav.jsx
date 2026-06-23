import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function TopNav() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

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
          <span className="text-noxWhite">{user.username}</span>
          <button onClick={handleLogout} className={`${linkClass} bg-transparent border-none cursor-pointer font-mono`}>
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