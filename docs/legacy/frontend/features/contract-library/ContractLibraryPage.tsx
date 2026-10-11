import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2,
  FileCheck,
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContractLibraryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const contracts = [
    { id: '1', title: 'ACME NDA 1 - Standard Confidentiality Agreement', tenant: 'bank-tenant', tenantName: 'ACME Capital Bank', type: 'NDA', status: 'Approved', risk: 'Low', clauses: 12, date: '2026-10-01', counterparty: 'Global Fintech Ltd' },
    { id: '2', title: 'High Risk MSA - Uncapped Indemnity Clause', tenant: 'bank-tenant', tenantName: 'ACME Capital Bank', type: 'MSA', status: 'AwaitingApproval', risk: 'High', clauses: 24, date: '2026-10-01', counterparty: 'Apex Cloud Systems' },
    { id: '3', title: 'Standard NDA (with footnote prompt injection)', tenant: 'bank-tenant', tenantName: 'ACME Capital Bank', type: 'NDA', status: 'AwaitingApproval', risk: 'High', clauses: 14, date: '2026-10-01', counterparty: 'CyberShield Sec' },
    { id: '4', title: 'Critical Risk - Unilateral Termination Clause', tenant: 'bank-tenant', tenantName: 'ACME Capital Bank', type: 'MSA', status: 'AwaitingApproval', risk: 'Critical', clauses: 18, date: '2026-10-01', counterparty: 'Vanguard Holdings' },
    { id: '5', title: 'TechFlow SaaS Agreement - Annual Subscription', tenant: 'saas-tenant', tenantName: 'TechFlow SaaS Inc', type: 'SaaS', status: 'Approved', risk: 'Low', clauses: 16, date: '2026-09-30', counterparty: 'CloudScale Inc' },
    { id: '6', title: 'High Risk SaaS - Auto Renew 90 days Notice', tenant: 'saas-tenant', tenantName: 'TechFlow SaaS Inc', type: 'SaaS', status: 'AwaitingApproval', risk: 'High', clauses: 20, date: '2026-09-30', counterparty: 'OmniData Systems' },
    { id: '7', title: 'Critical Risk - GDPR Data Transfer Gap', tenant: 'saas-tenant', tenantName: 'TechFlow SaaS Inc', type: 'SaaS', status: 'AwaitingApproval', risk: 'Critical', clauses: 22, date: '2026-09-29', counterparty: 'EuroTech GmbH' },
    { id: '8', title: 'Precision Supply Agreement - Manufacturing Parts', tenant: 'manufacturer-tenant', tenantName: 'Precision Mfg Corp', type: 'Supply', status: 'Approved', risk: 'Low', clauses: 30, date: '2026-09-29', counterparty: 'RoboParts Inc' },
    { id: '9', title: 'High Risk Supply - Exclusive Distribution Terms', tenant: 'manufacturer-tenant', tenantName: 'Precision Mfg Corp', type: 'Supply', status: 'AwaitingApproval', risk: 'High', clauses: 28, date: '2026-09-28', counterparty: 'Titan Logistics' },
    { id: '10', title: 'Precision Procurement - EU Jurisdiction SLA', tenant: 'manufacturer-tenant', tenantName: 'Precision Mfg Corp', type: 'Procurement', status: 'Approved', risk: 'Low', clauses: 15, date: '2026-09-28', counterparty: 'Bavaria Motors' },
  ];

  const handleUploadSimulate = () => {
    setUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setIsUploadOpen(false);
            setUploadProgress(0);
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.counterparty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTenant = selectedTenant === 'all' || c.tenant === selectedTenant;
    const matchesRisk = selectedRisk === 'all' || c.risk.toLowerCase() === selectedRisk.toLowerCase();
    return matchesSearch && matchesTenant && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contract Repository</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Multi-tenant library of ingested agreements with AI clause extraction & risk flags.
          </p>
        </div>

        <button 
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" /> Upload New Agreement
        </button>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Upload Contract for Ingestion</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contract Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement 2026"
                  className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Target Tenant Isolation</label>
                <select className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none">
                  <option value="bank-tenant">ACME Capital Bank</option>
                  <option value="saas-tenant">TechFlow SaaS Inc</option>
                  <option value="manufacturer-tenant">Precision Mfg Corp</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center bg-gray-50 dark:bg-gray-800/40">
                <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Drag & drop PDF or DOCX file here</p>
                <p className="text-[11px] text-gray-400 mt-1">Automatic spaCy PII tagging & LangGraph risk analysis</p>
              </div>

              {uploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-blue-600 font-semibold">
                    <span>Processing Ingestion Pipeline...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full" 
                      style={{ width: `${uploadProgress}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSimulate}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {uploading ? 'Ingesting...' : 'Start Ingestion Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Search, Filters, View Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts by title, type, or counterparty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
          >
            <option value="all">All Tenants</option>
            <option value="bank-tenant">ACME Capital Bank</option>
            <option value="saas-tenant">TechFlow SaaS Inc</option>
            <option value="manufacturer-tenant">Precision Mfg Corp</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
          >
            <option value="all">All Risk Tiers</option>
            <option value="low">Low Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-gray-600 dark:text-gray-300 transition ${
                viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : ''
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-gray-600 dark:text-gray-300 transition ${
                viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : ''
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((c) => (
            <div 
              key={c.id} 
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {c.type}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    c.risk === 'Critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    c.risk === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {c.risk} Risk
                  </span>
                </div>
                
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                  {c.title}
                </h3>
                
                <p className="text-xs text-gray-500 mt-1">Counterparty: <span className="font-semibold text-gray-700 dark:text-gray-300">{c.counterparty}</span></p>
                <p className="text-[11px] text-gray-400 mt-0.5">{c.tenantName}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">{c.clauses} Clauses</span>
                <button
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Eye className="h-3.5 w-3.5" /> Analyze
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">Contract Title</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-gray-100">{c.title}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{c.counterparty}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.tenantName}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.type}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      c.risk === 'Critical' ? 'bg-red-500/10 text-red-600' :
                      c.risk === 'High' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {c.risk}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{c.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
