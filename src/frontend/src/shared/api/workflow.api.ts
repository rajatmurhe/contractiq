import { api } from './axios-instance';

export const workflowApi = {
  start: async (contractId: string) => ({ runId: 'run-1' }),
  getStatus: async (runId: string) => ({ status: 'Running' }),
  approve: async (runId: string, decision: any) => {},
  reject: async (runId: string, reason: string) => {},
  getPendingApprovals: async () => [],
  replay: async (runId: string) => {},
};
