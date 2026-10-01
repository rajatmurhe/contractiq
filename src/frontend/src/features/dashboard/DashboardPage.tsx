import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap,
  Activity,
  Layers,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const stats = [
    { title: 'Total Ingested Contracts', value: '42', change: '+18% vs last week', icon: FileText, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { title: 'Pending Human Approvals', value: '5', change: '2 SLA Risk (<2h)', icon: Clock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { title: 'High Risk Flagged', value: '8', change: '1 Critical Injection', icon: AlertTriangle, color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    { title: 'Auto-Approval Rate', value: '84.2%', change: 'Policy standard >80%', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];

  // Recharts Dataset
  const volumeData = [
    { day: 'Mon', contracts: 4, highRisk: 1 },
    { day: 'Tue', contracts: 7, highRisk: 2 },
    { day: 'Wed', contracts: 12, highRisk: 3 },
    { day: 'Thu', contracts: 9, highRisk: 1 },
    { day: 'Fri', contracts: 15, highRisk: 4 },
    { day: 'Sat', contracts: 3, highRisk: 0 },
    { day: 'Sun', contracts: 5, highRisk: 1 },
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: 29, color: '#10b981' },
    { name: 'Medium Risk', value: 5, color: '#f59e0b' },
    { name: 'High Risk', value: 6, color: '#f97316' },
    { name: 'Critical Risk', value: 2, color: '#ef4444' },
  ];

  const recentApprovals = [
    { id: '1', title: 'High Risk MSA - Uncapped Indemnity', tenant: 'ACME Capital Bank', risk: 'HIGH', sla: '1h 12m', status: 'Awaiting Approval' },
    { id: '2', title: 'High Risk SaaS - Auto Renew 90 days', tenant: 'TechFlow SaaS Inc', risk: 'HIGH', sla: '3h 45m', status: 'Awaiting Approval' },
    { id: '3', title: 'Critical Risk - Unilateral Termination', tenant: 'ACME Capital Bank', risk: 'CRITICAL', sla: '0h 25m', status: 'Urgent' },
    { id: '4', title: 'High Risk Supply - Exclusivity Clause', tenant: 'Precision Mfg Corp', risk: 'HIGH', sla: '6h 10m', status: 'Awaiting Approval' },
  ];

  const recentContracts = [
    { id: 'c1', title: 'ACME Bank Standard NDA v4', type: 'NDA', tenant: 'ACME Capital Bank', status: 'Approved', risk: 'Low', date: 'Oct 01, 2026' },
    { id: 'c2', title: 'TechFlow Enterprise Subscription', type: 'SaaS', tenant: 'TechFlow SaaS Inc', status: 'Processing', risk: 'Medium', date: 'Oct 01, 2026' },
    { id: 'c3', title: 'Precision Supply Chain Master', type: 'Supply', tenant: 'Precision Mfg Corp', status: 'Approved', risk: 'Low', date: 'Sep 30, 2026' },
    { id: 'c4', title: 'Global Data License Agreement', type: 'License', tenant: 'TechFlow SaaS Inc', status: 'IngestionCompleted', risk: 'High', date: 'Sep 30, 2026' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 p-6 rounded-2xl border border-blue-500/20 shadow-sm">
        <div>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 rounded-full">
            Autonomous Contract Intelligence
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-2">
            Enterprise Governance Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            AI proposes → Policy validates → Human approves high-risk actions → Executed in SAP & Salesforce.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/contracts')} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
          >
            <Sparkles className="h-4 w-4" /> Ingest New Contract
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{stat.value}</span>
                <span className="text-[11px] font-medium text-gray-500">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion & Risk Trends Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Contract Ingestion & Risk Analysis Volume</h3>
              <p className="text-xs text-gray-400">Daily contracts ingested vs high-risk clauses flagged</p>
            </div>
            <div className="flex gap-1 text-[11px] bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button className="px-2.5 py-1 font-semibold rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm">7D</button>
              <button className="px-2.5 py-1 font-medium text-gray-500">30D</button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} 
                />
                <Area type="monotone" dataKey="contracts" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorContracts)" name="Ingested Contracts" />
                <Area type="monotone" dataKey="highRisk" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" name="High Risk Flagged" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Risk Profile Breakdown</h3>
            <p className="text-xs text-gray-400">Distribution across active portfolio</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {riskDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-gray-400">{item.name}:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Approvals Inbox Widget */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Pending Human Approvals</h3>
              <p className="text-xs text-gray-400">High-risk contract actions requiring explicit authorization</p>
            </div>
            <button 
              onClick={() => navigate('/approvals')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              View Inbox <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {recentApprovals.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-xl transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      item.risk === 'CRITICAL' 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.risk}
                    </span>
                    <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{item.tenant}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3 w-3" /> SLA: {item.sla}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Audit Verification Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">
            Security & Audit Shield
          </h3>
          
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Audit Chain Verified</h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                All SHA-256 cryptographic logs are valid and untampered across 8 event blocks.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Agent Framework</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200">LangGraph (Supervisor)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Injection Classifier</span>
              <span className="font-bold text-emerald-600">Active (100% Blocked)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Database Row Level Security</span>
              <span className="font-bold text-emerald-600">Enforced</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">LLM Provider</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200">FakeDeterministic / Ollama</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => navigate('/audit')}
              className="w-full py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Open Cryptographic Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Recent Contracts Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Recently Processed Contracts</h3>
            <p className="text-xs text-gray-400">Contracts analyzed by agent specialist nodes</p>
          </div>
          <button 
            onClick={() => navigate('/contracts')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View Contract Library →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3 px-3">Contract Name</th>
                <th className="py-3 px-3">Tenant</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentContracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-gray-100">{c.title}</td>
                  <td className="py-3 px-3 text-gray-500">{c.tenant}</td>
                  <td className="py-3 px-3 text-gray-500">{c.type}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      c.risk === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                      c.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {c.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
