import request from './client.js';

export const registerUser = (payload) => request('/auth/register', { method: 'POST', body: payload });
export const loginUser = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const fetchMe = (token) => request('/auth/me', { token });