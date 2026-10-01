import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../shared/auth/ProtectedRoute';
import { Layout } from '../shared/components/ui/Layout';

const DashboardPage = React.lazy(() => import('../features/dashboard/DashboardPage'));
const ContractLibraryPage = React.lazy(() => import('../features/contract-library/ContractLibraryPage'));
const ContractViewerPage = React.lazy(() => import('../features/contract-viewer/ContractViewerPage'));
const ApprovalInboxPage = React.lazy(() => import('../features/approval-inbox/ApprovalInboxPage'));
const AuditViewPage = React.lazy(() => import('../features/audit/AuditViewPage'));
const AgentTracePage = React.lazy(() => import('../features/agent-trace/AgentTracePage'));

const App: React.FC = () => {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contracts" element={<ContractLibraryPage />} />
          <Route path="/contracts/:id" element={<ContractViewerPage />} />
          <Route path="/approvals" element={<ApprovalInboxPage />} />
          <Route path="/audit" element={<AuditViewPage />} />
          <Route path="/trace/:runId" element={<AgentTracePage />} />
          <Route path="/callback" element={<div>Auth Callback</div>} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
