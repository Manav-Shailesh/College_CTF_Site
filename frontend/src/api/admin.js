import request from './client.js';

export const fetchLeaderboard = () => request('/leaderboard');

export const adminLogin = (payload) => request('/admin/login', { method: 'POST', body: payload });
export const fetchAdminOverview = (token) => request('/admin/overview', { token });