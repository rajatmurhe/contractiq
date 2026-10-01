import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Bot, 
  Sparkles, 
  Send,
  Eye,
  Lock
} from 'lucide-react';

export default function ContractViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clauses' | 'risk' | 'copilot'>('clauses');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I have extracted 24 clauses and performed risk analysis on this agreement. Ask me anything about liability caps, renewal terms, or GDPR compliance!' }
  ]);

  const contractData = {
    title: 'High Risk MSA - Uncapped Indemnity Clause',
    tenant: 'ACME Capital Bank',
    type: 'MSA',
    riskLevel: 'HIGH',
    status: 'AwaitingApproval',
    uploadedAt: '2026-10-01 19:05:12',
    fileSize: '2.4 MB (PDF)',
    clauses: [
      { id: 1, type: 'Indemnification', text: 'Supplier shall defend, indemnify and hold harmless Customer without any monetary limitation or liability cap.', risk: 'High', verified: true },
      { id: 2, type: 'LimitationOfLiability', text: 'Neither party shall be liable for indirect, incidental or consequential damages.', risk: 'Low', verified: true },
      { id: 3, type: 'Termination', text: 'Either party may terminate for material breach upon 30 days written notice.', risk: 'Low', verified: true },
      { id: 4, type: 'RenewalAutoRenewal', text: 'This agreement automatically renews for successive 1-year terms unless cancelled 90 days prior.', risk: 'Medium', verified: false },
    ],
    riskFindings: [
      { id: 1, severity: 'High', clauseType: 'Indemnification', description: 'Uncapped indemnity obligation exposes tenant to unlimited financial liability.', citation: 'Section 8.1, Page 4' },
      { id: 2, severity: 'Medium', clauseType: 'RenewalAutoRenewal', description: '90-day cancellation window is strict compared to 30-day playbook standard.', citation: 'Section 3.2, Page 2' },
    ]
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsgs = [...messages, { sender: 'user', text: chatInput }];
    setMessages(newMsgs);
    setChatInput('');
    setTimeout(() => {
      setMessages([...newMsgs, { 
        sender: 'ai', 
        text: `Based on Section 8.1 of this MSA, indemnification is uncapped. The AI Agent flagged this as HIGH risk and routed it to your Approval Inbox under SLA rule #4.` 
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Contract Library
        </button>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-full">
          HIGH RISK • AWAITING HUMAN APPROVAL
        </span>
      </div>

      {/* Contract Title Info */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{contractData.title}</h1>
          <p className="text-xs text-gray-500 mt-1">Tenant: {contractData.tenant} • File: {contractData.fileSize} • Uploaded: {contractData.uploadedAt}</p>
        </div>
        <button 
          onClick={() => navigate('/trace/demo-run-1790889705')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition self-start"
        >
          <Sparkles className="h-4 w-4" /> View Agent Trace Graph
        </button>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document Mock / Reader */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-6 min-h-[500px] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
            <span className="text-xs font-bold text-gray-500">PDF READER VIEW (Page 4 of 12)</span>
            <span className="text-xs text-gray-400">Zoom: 100%</span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 text-xs leading-relaxed space-y-4 font-serif text-gray-800 dark:text-gray-200">
            <h4 className="font-bold text-sm font-sans">8. INDEMNIFICATION AND LIABILITY</h4>
            <p>
              8.1 <mark className="bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 px-1 py-0.5 rounded font-medium">
                Supplier shall defend, indemnify and hold harmless Customer without any monetary limitation or liability cap
              </mark> against any third party claims, liabilities, or losses arising from performance under this agreement.
            </p>
            <p className="text-gray-400 font-sans italic text-[11px]">
              [Highlighted in amber by Risk Specialist Agent • Citation Chunk #c991]
            </p>
          </div>

          <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-800">
            Powered by PDF.js with OCR Fallback Layer
          </div>
        </div>

        {/* Right: Analysis Tabs (Clauses, Risk, Copilot) */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm flex flex-col h-[550px]">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 mb-4 gap-4">
            <button
              onClick={() => setActiveTab('clauses')}
              className={`pb-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'clauses' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'
              }`}
            >
              Extracted Clauses ({contractData.clauses.length})
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`pb-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'risk' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'
              }`}
            >
              Risk Findings ({contractData.riskFindings.length})
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`pb-2 text-xs font-semibold border-b-2 transition ${
                activeTab === 'copilot' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'
              }`}
            >
              Ask AI Copilot ✨
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'clauses' && (
              <div className="space-y-3">
                {contractData.clauses.map((c) => (
                  <div key={c.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">{c.type}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        c.risk === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {c.risk} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">"{c.text}"</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="space-y-3">
                {contractData.riskFindings.map((r) => (
                  <div key={r.id} className="p-3 border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-800 dark:text-amber-300">{r.clauseType}</span>
                      <span className="text-[10px] text-gray-400">{r.citation}</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200">{r.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'copilot' && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-xs ${
                        m.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <input
                    type="text"
                    placeholder="Ask about this contract..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
