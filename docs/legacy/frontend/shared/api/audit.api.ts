import { api } from './axios-instance';

export const auditApi = {
  list: async (filters: any, page: number) => ({ items: [], total: 0 }),
  verify: async () => ({ valid: true }),
};
