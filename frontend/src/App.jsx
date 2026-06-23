import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import {
  RequireUser,
  RequireAdmin,
  RedirectIfUser,
  RedirectIfAdmin
} from './components/RouteGuards.jsx';

import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Terminal from './pages/Terminal.jsx';
import Leaderboard from './pages/LeaderBoard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route
            path="/register"
            element={
              <RedirectIfUser>
                <Register />
              </RedirectIfUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfUser>
                <Login />
              </RedirectIfUser>
            }
          />
          <Route
            path="/terminal"
            element={
              <RequireUser>
                <Terminal />
              </RequireUser>
            }
          />

          <Route
            path="/admin/login"
            element={
              <RedirectIfAdmin>
                <AdminLogin />
              </RedirectIfAdmin>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}