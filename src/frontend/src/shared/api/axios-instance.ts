import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  config.headers['Authorization'] = 'Bearer mock-token';
  config.headers['X-Correlation-Id'] = crypto.randomUUID();
  config.headers['X-Tenant-Id'] = 'tenant-1';
  return config;
});
