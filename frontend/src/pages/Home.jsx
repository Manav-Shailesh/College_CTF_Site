import { Link } from 'react-router-dom';
import NoxLogo from '../components/NoxLogo.jsx';
import TopNav from '../components/TopNav.jsx';

export default function Home() {
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

      <main className="bg-noxPanel border border-white/10 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-2xl text-noxRed" style={{ textShadow: '0 0 12px rgba(226,35,26,0.45)' }}>⛧</span>
          <h2 className="text-lg tracking-[0.18em] font-bold">ABOUT</h2>
        </div>
        <p className="text-noxAsh text-sm leading-relaxed my-4">
         NOX is a community of offsec students. We create CTF Labs with real-world problems that keep you thinking.<br> 
         Bring your curiosity, sharpen your skills, and push your limits.In NOX’s CTF Labs, every solve is progress—every next round raises the bar.
        </p>
        <div className="text-center my-8">
  <p className="text-noxAsh text-sm leading-relaxed my-4">
    Let's Make It Chaotic.
  </p>
</div>
        <div className="flex gap-3 flex-wrap mt-5">
          <Link
            to="/register"
            className="bg-gradient-to-br from-noxRed to-noxRedDim text-noxWhite font-bold tracking-wider text-xs px-6 py-3 rounded-md shadow-noxGlow hover:shadow-noxGlowLg hover:-translate-y-0.5 transition-all"
          >
            REGISTER TO BEGIN
          </Link>
          <Link
            to="/leaderboard"
            className="border border-white/10 text-noxWhite font-bold tracking-wider text-xs px-6 py-3 rounded-md hover:-translate-y-0.5 transition-all"
          >
            VIEW LEADERBOARD
          </Link>
        </div>
      </main>

      <footer className="text-center mt-12 pt-5 border-t border-white/10 text-noxAsh text-xs leading-relaxed">
        <p><strong className="text-noxWhite tracking-wider">NOX</strong> </p>
      </footer>
    </div>
  );
}
