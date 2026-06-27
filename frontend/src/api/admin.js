import request from './client.js';

export const fetchLeaderboard = () => request('/leaderboard');

export const adminLogin = (payload) => request('/admin/login', { method: 'POST', body: payload });
export const fetchAdminOverview = (token) => request('/admin/overview', { token });

export const removeUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE', token });

export const banUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}/ban`, { method: 'POST', token });

export const fetchBannedEmails = (token) => request('/admin/banned', { token });

export const unbanUser = (email, token) =>
  request(`/admin/users/${encodeURIComponent(email)}/ban`, { method: 'DELETE', token });

export const setResourceLink = (driveLink, token) =>
  request('/admin/resource', { method: 'POST', body: { driveLink }, token });

//timer related
export const startTimer = (token) =>
  request('/admin/timer/start', { method: 'POST', token });
export const stopTimer = (token) =>
  request('/admin/timer/stop', { method: 'POST', token });
export const pauseTimer = (token) =>
  request('/admin/timer/pause', { method: 'POST', token });
export const continueTimer = (token) =>
  request('/admin/timer/continue', { method: 'POST', token });
export const resetTimer = (token) =>
  request('/admin/timer/reset', { method: 'POST', token });