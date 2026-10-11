import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Download, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  GitCommit,
  ArrowRight,
  Code2,
  X
} from 'lucide-react';

export default function AuditViewPage() {
  const [tampered, setTampered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  const auditEvents = [
    { id: 'evt-001', type: 'ContractUploaded', actor: 'user:bank-admin', resource: 'contract:c101', time: '2026-10-01 19:05:12', hash: '8f92a1c89f2a1c89', prevHash: '0000000000000000', payload: { title: 'ACME Bank Standard NDA v4', size: '2.4MB', mime: 'application/pdf' } },
    { id: 'evt-002', type: 'IngestionStarted', actor: 'system:ingestion', resource: 'contract:c101', time: '2026-10-01 19:05:14', hash: '4b11f9da9814b11f', prevHash: '8f92a1c89f2a1c89', payload: { pages: 12, ocrUsed: false, textDensity: 0.88 } },
    { id: 'evt-003', type: 'ExtractionCompleted', actor: 'agent:extraction', resource: 'contract:c101', time: '2026-10-01 19:05:18', hash: '9c8821ab3329c882', prevHash: '4b11f9da9814b11f', payload: { clausesExtracted: 24, avgConfidence: 0.94 } },
    { id: 'evt-004', type: 'PromptInjectionDetected', actor: 'agent:injection_classifier', resource: 'contract:c101', time: '2026-10-01 19:05:19', hash: tampered ? 'CORRUPTED_HASH_9999' : '3e7710bf1103e771', prevHash: '9c8821ab3329c882', payload: tampered ? { tamperedPayload: 'TAMPERED_BY_SQL_INJECTION' } : { matchedPattern: 'ignore previous instructions', confidence: 0.99 } },
    { id: 'evt-005', type: 'ApprovalRequired', actor: 'supervisor:langgraph', resource: 'workflow:w991', time: '2026-10-01 19:05:22', hash: '7a6612dc5547a661', prevHash: tampered ? 'CORRUPTED_HASH_9999' : '3e7710bf1103e771', payload: { riskLevel: 'HIGH', ruleId: 'R-401', slaDeadline: '4h' } },
    { id: 'evt-006', type: 'HumanApprovalGranted', actor: 'user:legal-approver', resource: 'workflow:w991', time: '2026-10-01 19:06:01', hash: '1d4400ae8911d440', prevHash: '7a6612dc5547a661', payload: { approvedBy: 'legal@acmecapital.com', decision: 'Approved' } },
    { id: 'evt-007', type: 'SapPurchaseOrderCreated', actor: 'integration:sap-adapter', resource: 'sap:PO-99812', time: '2026-10-01 19:06:04', hash: '5f3319cd4415f331', prevHash: '1d4400ae8911d440', payload: { poId: 'PO-99812', vendorId: 'VEND-881', amount: 250000 } },
    { id: 'evt-008', type: 'SalesforceOpportunityCreated', actor: 'integration:salesforce-adapter', resource: 'sf:006Dn000', time: '2026-10-01 19:06:05', hash: '2a1100ba1232a110', prevHash: '5f3319cd4415f331', payload: { opportunityId: '006Dn00000XXXXX', stage: 'Closed Won' } },
  ];

  const filteredEvents = auditEvents.filter(e => 
    e.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cryptographic Audit Chain</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Immutable SHA-256 hash-chained event ledger for AI decisions & enterprise mutations.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTampered(!tampered)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm ${
              tampered ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {tampered ? 'Restore DB Integrity' : 'Simulate Direct SQL Record Tamper'}
          </button>
        </div>
      </div>

      {/* Verification Shield Banner */}
      <div className={`rounded-2xl border p-5 transition flex items-center justify-between shadow-sm ${
        tampered 
          ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-300' 
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
      }`}>
        <div className="flex items-center gap-3">
          {tampered ? (
            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div>
            <h3 className="font-bold text-base">
              {tampered ? 'CHAIN VERIFICATION FAILED: Database Tampering Detected!' : 'Cryptographic Chain Status: VALID & UNBROKEN'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {tampered 
                ? 'SHA-256 hash mismatch at Event Block ID: evt-004. Computed hash does not match stored signature.'
                : 'All 8 audit event blocks verified sequentially against Genesis Block. Zero hash breaks detected.'}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
          tampered ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {tampered ? 'BROKEN AT evt-004' : '100% UNTAMPERED'}
        </span>
      </div>

      {/* Hash-Chain Visualizer */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">SHA-256 Hash Chain Visualization</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {auditEvents.map((evt, idx) => (
            <React.Fragment key={evt.id}>
              <div 
                onClick={() => setSelectedPayload(evt)}
                className={`p-3 rounded-xl border text-center shrink-0 w-36 cursor-pointer hover:scale-105 transition ${
                  tampered && evt.id === 'evt-004'
                    ? 'border-red-500 bg-red-500/10 text-red-600 font-bold'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">{evt.type}</p>
                <p className="text-[9px] font-mono text-gray-400 mt-1 truncate">#{evt.hash.substring(0, 8)}</p>
              </div>
              {idx < auditEvents.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-700 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit events by type, actor, or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3 px-3">Event ID</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Actor / Agent</th>
                <th className="py-3 px-3">Resource</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">SHA-256 Hash</th>
                <th className="py-3 px-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredEvents.map((e) => (
                <tr 
                  key={e.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                    tampered && e.id === 'evt-004' ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold' : ''
                  }`}
                >
                  <td className="py-3.5 px-3">{e.id}</td>
                  <td className="py-3.5 px-3 font-semibold text-blue-600 dark:text-blue-400">{e.type}</td>
                  <td className="py-3.5 px-3 text-gray-700 dark:text-gray-300">{e.actor}</td>
                  <td className="py-3.5 px-3 text-gray-500">{e.resource}</td>
                  <td className="py-3.5 px-3 text-gray-400">{e.time}</td>
                  <td className="py-3.5 px-3 text-gray-400 text-[10px]">{e.hash}</td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedPayload(e)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                Payload JSON: {selectedPayload.id} ({selectedPayload.type})
              </h3>
              <button onClick={() => setSelectedPayload(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <pre className="p-4 bg-gray-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-gray-800">
              {JSON.stringify(selectedPayload.payload, null, 2)}
            </pre>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-mono">Prev Hash: {selectedPayload.prevHash}</span>
              <button
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
