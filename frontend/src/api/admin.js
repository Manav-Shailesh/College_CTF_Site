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