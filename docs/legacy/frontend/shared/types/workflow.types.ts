export type WorkflowStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';
export interface WorkflowRunDetail { id: string; status: WorkflowStatus; }
export interface ApprovalItem { id: string; contractId: string; runId: string; }
export interface ApprovalDecision { approved: boolean; comments?: string; }
export interface WorkflowNode { id: string; name: string; status: string; }
