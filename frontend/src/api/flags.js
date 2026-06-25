import request from './client.js';

export const fetchProgress = (token) => request('/flags/progress', { token });
export const submitFlag = (sin, candidate, token) =>
  request(`/flags/${sin}/submit`, { method: 'POST', body: { candidate }, token });
export const fetchResource = (token) => request('/flags/resource', { token });