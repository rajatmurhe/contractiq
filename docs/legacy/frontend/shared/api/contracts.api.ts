import { api } from './axios-instance';
import { ContractSummary, ContractDetail, Clause, RiskReport } from '../types/contract.types';

export const contractsApi = {
  upload: async (file: File, title: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    return api.post('/contracts', formData).then(res => res.data);
  },
  list: async (filters: any, page: number): Promise<{ items: ContractSummary[], total: number }> => {
    return { items: [], total: 0 };
  },
  get: async (id: string): Promise<ContractDetail> => {
    return {} as ContractDetail;
  },
  search: async (query: string) => [],
  getClauses: async (id: string, clauseType?: string): Promise<Clause[]> => [],
  getRiskReport: async (id: string): Promise<RiskReport> => ({} as RiskReport),
};
