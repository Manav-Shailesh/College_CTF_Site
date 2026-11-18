
import request from './client.js';

// Public leaderboard
export const fetchLeaderboard = (sessionId) =>
  request(
    sessionId
      ? `/leaderboard?sessionId=${encodeURIComponent(sessionId)}`
      : '/leaderboard'
  );

// Admin authentication
export const adminLogin = (payload) =>
  request('/admin/login', {
    method: 'POST',
    body: payload
  });

// Admin overview for current or selected competition
export const fetchAdminOverview = (token, sessionId) =>
  request(
    sessionId
      ? `/admin/overview?sessionId=${encodeURIComponent(sessionId)}`
      : '/admin/overview',
    { token }
  );

// User management
export const removeUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    token
  });

export const banUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}/ban`, {
    method: 'POST',
    token
  });

export const fetchBannedEmails = (token) =>
  request('/admin/banned', { token });

export const unbanUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}/ban`, {
    method: 'DELETE',
    token
  });

// Resource management
export const setResourceLink = (driveLink, token) =>
  request('/admin/resource', {
    method: 'POST',
    body: { driveLink },
    token
  });

// Competition session management
export const fetchSessions = (token) =>
  request('/sessions/all', { token });

export const createSession = (name, token) =>
  request('/sessions/create', {
    method: 'POST',
    body: { name },
    token
  });

export const startSession = (token) =>
  request('/sessions/start', {
    method: 'POST',
    token
  });

export const stopSession = (token) =>
  request('/sessions/stop', {
    method: 'POST',
    token
  });

  export const fetchPublicSessions = () =>
  request('/sessions/public');