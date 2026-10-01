import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Database, 
  GitBranch, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export default function AgentTracePage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const graphNodes = [
    { name: 'ingestion_node', role: 'OCR & Document Structure', status: 'Completed', duration: '1.2s', tokens: 0 },
    { name: 'extraction_node', role: 'Clause Extraction Specialist', status: 'Completed', duration: '3.4s', tokens: 4210 },
    { name: 'risk_node', role: 'Risk Playbook Analyzer', status: 'Completed', duration: '2.1s', tokens: 2890 },
    { name: 'compliance_node', role: 'GDPR & Policy Guard', status: 'Completed', duration: '1.8s', tokens: 1950 },
    { name: 'critic_node', role: 'Citation Verification Critic', status: 'Completed', duration: '2.5s', tokens: 3100 },
    { name: 'approval_gate_node', role: 'Human-in-the-loop Gate', status: 'Interrupt (Risk HIGH)', duration: 'Active', tokens: 0 },
    { name: 'integration_node', role: 'SAP / Salesforce Adapter', status: 'Pending Approval', duration: '-', tokens: 0 },
    { name: 'audit_node', role: 'SHA-256 Hash Chain Logger', status: 'Pending Approval', duration: '-', tokens: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <span className="font-mono text-xs text-gray-400">Run ID: {runId || 'demo-run-1790889705'}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">LangGraph Supervisor Trace</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Real-time node execution graph, state checkpoints, and token lineage.
        </p>
      </div>

      {/* Execution Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl">
          <span className="text-xs text-gray-500">Workflow Version</span>
          <p className="text-lg font-bold font-mono">v0.1.0-langgraph</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl">
          <span className="text-xs text-gray-500">Total Tokens Consumed</span>
          <p className="text-lg font-bold font-mono text-blue-600">12,150 tokens</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl">
          <span className="text-xs text-gray-500">Execution Time</span>
          <p className="text-lg font-bold font-mono">11.0 seconds</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl">
          <span className="text-xs text-gray-500">State Checkpointer</span>
          <p className="text-lg font-bold font-mono text-emerald-600">Sqlite / SQL Server</p>
        </div>
      </div>

      {/* Node Flow Diagram */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
          Node Execution Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {graphNodes.map((node, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                node.status.includes('Interrupt')
                  ? 'border-amber-500 bg-amber-500/10'
                  : node.status === 'Completed'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{node.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    node.status.includes('Interrupt')
                      ? 'bg-amber-500 text-white'
                      : node.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{node.role}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <span>Time: {node.duration}</span>
                <span>{node.tokens > 0 ? `${node.tokens} tok` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
