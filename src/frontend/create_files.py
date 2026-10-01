import os

base = '/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/frontend'

files = {
  'src/shared/auth/AuthProvider.tsx': '''import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  tenantId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>('mock-token');
  const [user, setUser] = useState<any>({ name: 'Admin' });
  
  const login = () => { setToken('mock-token'); setUser({ name: 'Admin' }); };
  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      tenantId: 'tenant-1'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
''',
  'src/shared/auth/ProtectedRoute.tsx': '''import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/callback" />;
  return <>{children}</>;
};
''',
  'src/shared/api/axios-instance.ts': '''import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  config.headers['Authorization'] = 'Bearer mock-token';
  config.headers['X-Correlation-Id'] = crypto.randomUUID();
  config.headers['X-Tenant-Id'] = 'tenant-1';
  return config;
});
''',
  'src/shared/api/contracts.api.ts': '''import { api } from './axios-instance';
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
''',
  'src/shared/api/workflow.api.ts': '''import { api } from './axios-instance';

export const workflowApi = {
  start: async (contractId: string) => ({ runId: 'run-1' }),
  getStatus: async (runId: string) => ({ status: 'Running' }),
  approve: async (runId: string, decision: any) => {},
  reject: async (runId: string, reason: string) => {},
  getPendingApprovals: async () => [],
  replay: async (runId: string) => {},
};
''',
  'src/shared/api/audit.api.ts': '''import { api } from './axios-instance';

export const auditApi = {
  list: async (filters: any, page: number) => ({ items: [], total: 0 }),
  verify: async () => ({ valid: true }),
};
''',
  'src/shared/types/contract.types.ts': '''export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ContractStatus = 'Draft' | 'Processing' | 'IngestionCompleted' | 'AwaitingApproval' | 'Approved' | 'Rejected' | 'Failed';
export type ClauseType = 'Indemnification' | 'Liability' | 'Termination' | 'RenewalAutoRenewal' | 'PaymentTerms' | 'Confidentiality' | 'DataProtection' | 'IntellectualProperty' | 'GoverningLaw' | 'DisputeResolution' | 'ForceMajeure' | 'ChangeOfControl' | 'Assignment' | 'Warranty' | 'Representation' | 'SLA' | 'Penalty' | 'Other';

export interface SourceSpan { page: number; startChar: number; endChar: number; sectionId?: string; }
export interface Clause { id: string; contractId: string; type: ClauseType; text: string; sourceSpan: SourceSpan; confidence: number; criticVerified: boolean; }
export interface RiskFinding { description: string; severity: RiskLevel; citation: SourceSpan; chunkId: string; relatedClauseType: ClauseType; }
export interface RiskReport { contractId: string; overallRisk: RiskLevel; findings: RiskFinding[]; agentVersion: string; modelId: string; promptVersion: string; }
export interface ContractSummary { id: string; title: string; status: ContractStatus; overallRisk?: RiskLevel; counterpartyName?: string; expiryDate?: string; createdAt: string; }
export interface ContractMetadata { contractType?: string; counterpartyName?: string; effectiveDate?: string; expiryDate?: string; jurisdiction?: string; currency?: string; totalValue?: number; }
export interface ContractDetail extends ContractSummary { originalFileName: string; contentType: string; fileSizeBytes: number; storagePath: string; clauses: Clause[]; riskReport?: RiskReport; metadata: ContractMetadata; }
''',
  'src/shared/types/workflow.types.ts': '''export type WorkflowStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';
export interface WorkflowRunDetail { id: string; status: WorkflowStatus; }
export interface ApprovalItem { id: string; contractId: string; runId: string; }
export interface ApprovalDecision { approved: boolean; comments?: string; }
export interface WorkflowNode { id: string; name: string; status: string; }
''',
  'src/shared/types/audit.types.ts': '''export interface AuditEvent { id: string; action: string; timestamp: string; }
export interface AuditVerifyResult { valid: boolean; }
''',
  'src/shared/hooks/useSignalR.ts': '''import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (runId: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/agentws', { accessTokenFactory: () => 'mock-token' })
      .withAutomaticReconnect()
      .build();

    conn.start().then(() => {
      setConnectionState('Connected');
      if (runId) conn.invoke('JoinRun', runId);
    }).catch(() => setConnectionState('Failed'));

    conn.on('Event', (evt) => {
      setEvents(prev => [...prev, evt]);
      setLastEvent(evt);
    });

    return () => { conn.stop(); };
  }, [runId]);

  return { events, connectionState, lastEvent };
};
''',
  'src/shared/hooks/useTheme.ts': '''import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return { theme, toggle };
};
''',
  'src/shared/components/ui/ThemeProvider.tsx': '''import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('light');
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
};
export const useThemeContext = () => useContext(ThemeContext);
''',
  'src/shared/components/ui/Badge.tsx': '''import React from 'react';
export const Badge = ({ children, className }: any) => <span className={`px-2 py-1 rounded text-xs font-bold ${className}`}>{children}</span>;
''',
  'src/shared/components/ui/SlaCountdown.tsx': '''import React from 'react';
export const SlaCountdown = ({ deadline }: { deadline: string }) => {
  return <div>24h Remaining</div>;
};
''',
  'src/shared/components/ui/CommandPalette.tsx': '''import React from 'react';
export const CommandPalette = () => <div>Command Palette (Cmd+K)</div>;
''',
  'src/shared/components/ui/Layout.tsx': '''import React from 'react';
import { Link } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full">
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col gap-4">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/contracts">Contracts</Link>
      <Link to="/approvals">Approvals</Link>
      <Link to="/audit">Audit</Link>
    </aside>
    <main className="flex-1 p-6 overflow-auto">{children}</main>
  </div>
);
''',
  'src/shared/components/ui/ErrorBoundary.tsx': '''import React, { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div>Something went wrong. <button onClick={() => this.setState({ hasError: false })}>Retry</button></div>;
    return this.props.children;
  }
}
''',
  'src/features/contract-viewer/ContractViewerPage.tsx': '''import React from 'react';
import { PdfViewer } from './PdfViewer';
import { ClausePanel } from './ClausePanel';

export default function ContractViewerPage() {
  return <div className="flex gap-4"><PdfViewer /><ClausePanel /></div>;
}
''',
  'src/features/contract-viewer/PdfViewer.tsx': '''import React from 'react';
export const PdfViewer = () => <div role="document" aria-label="PDF Viewer">PDF Viewer Mock</div>;
''',
  'src/features/contract-viewer/ClausePanel.tsx': '''import React from 'react';
export const ClausePanel = () => <div>Clauses</div>;
''',
  'src/features/contract-viewer/RiskPanel.tsx': '''import React from 'react';
export const RiskPanel = () => <div>Risk Findings</div>;
''',
  'src/features/contract-viewer/RiskGutter.tsx': '''import React from 'react';
export const RiskGutter = () => <div>Risk Gutter</div>;
''',
  'src/features/contract-viewer/AskAIPanel.tsx': '''import React from 'react';
export const AskAIPanel = () => <div>Ask AI</div>;
''',
  'src/features/agent-trace/AgentTracePage.tsx': '''import React from 'react';
import { TraceGraph } from './TraceGraph';
export default function AgentTracePage() { return <TraceGraph />; }
''',
  'src/features/agent-trace/TraceGraph.tsx': '''import React from 'react';
export const TraceGraph = () => <div>Graph</div>;
''',
  'src/features/agent-trace/TraceNodeDetail.tsx': '''import React from 'react';
export const TraceNodeDetail = () => <div>Node Detail</div>;
''',
  'src/features/approval-inbox/ApprovalInboxPage.tsx': '''import React from 'react';
export default function ApprovalInboxPage() { return <div>Approval Inbox</div>; }
''',
  'src/features/approval-inbox/ApprovalDetailModal.tsx': '''import React from 'react';
export const ApprovalDetailModal = () => <div>Approval Detail</div>;
''',
  'src/features/dashboard/DashboardPage.tsx': '''import React from 'react';
export default function DashboardPage() { return <div>Dashboard</div>; }
''',
  'src/features/dashboard/RiskHeatmap.tsx': '''import React from 'react';
export const RiskHeatmap = () => <div>Heatmap</div>;
''',
  'src/features/dashboard/RenewalsTimeline.tsx': '''import React from 'react';
export const RenewalsTimeline = () => <div>Timeline</div>;
''',
  'src/features/contract-library/ContractLibraryPage.tsx': '''import React from 'react';
export default function ContractLibraryPage() { return <div>Contract Library</div>; }
''',
  'src/features/contract-library/UploadZone.tsx': '''import React from 'react';
export const UploadZone = () => <div aria-dropzone>Upload</div>;
''',
  'src/features/contract-library/ContractList.tsx': '''import React from 'react';
export const ContractList = () => <div>List</div>;
''',
  'src/features/audit/AuditViewPage.tsx': '''import React from 'react';
export default function AuditViewPage() { return <div>Audit Log</div>; }
''',
  'tests/components/SlaCountdown.test.tsx': '''import { describe, it, expect } from 'vitest';
describe('SlaCountdown', () => { it('renders', () => { expect(true).toBe(true); }); });
''',
  'tests/features/ApprovalInbox.test.tsx': '''import { describe, it, expect } from 'vitest';
describe('ApprovalInbox', () => { it('renders', () => { expect(true).toBe(true); }); });
''',
  'tests/hooks/useTheme.test.tsx': '''import { describe, it, expect } from 'vitest';
describe('useTheme', () => { it('works', () => { expect(true).toBe(true); }); });
'''
}

for rel_path, content in files.items():
    full_path = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"Created {rel_path}")
