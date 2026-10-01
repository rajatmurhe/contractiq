import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  ShieldAlert, 
  Cpu, 
  Building2, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  ChevronDown, 
  Sparkles,
  Command,
  LogOut,
  ShieldCheck,
  Zap,
  Menu,
  X
} from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('bank-tenant');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const tenants = [
    { id: 'bank-tenant', name: 'ACME Capital Bank', plan: 'Enterprise Plan', badge: 'Bank' },
    { id: 'saas-tenant', name: 'TechFlow SaaS Inc', plan: 'Professional Plan', badge: 'SaaS' },
    { id: 'manufacturer-tenant', name: 'Precision Mfg Corp', plan: 'Enterprise Plan', badge: 'Mfg' },
  ];

  const currentTenantObj = tenants.find(t => t.id === selectedTenant) || tenants[0];

  const navItems = [
    {
      group: 'Core Intelligence',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
        { label: 'Contract Library', path: '/contracts', icon: FileText, badge: '42' },
        { label: 'Human Approvals', path: '/approvals', icon: CheckSquare, badge: '5', badgeColor: 'bg-amber-500 text-white' },
      ]
    },
    {
      group: 'Governance & Audit',
      items: [
        { label: 'Audit Chain Ledger', path: '/audit', icon: ShieldCheck, badge: 'Secured' },
        { label: 'Agent Trace Graph', path: '/trace/demo-run-1790889705', icon: Cpu, badge: 'Live' },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ContractIQ
              </span>
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                v2.0 Enterprise
              </span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.group}
              </h3>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        }`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          item.badgeColor || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tenant Switcher at Sidebar Bottom */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 relative">
          <button
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {currentTenantObj.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{currentTenantObj.plan}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          </button>

          {/* Tenant Select Modal/Menu */}
          {tenantDropdownOpen && (
            <div className="absolute bottom-16 left-3 right-3 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-2 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Switch Active Tenant</p>
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    setSelectedTenant(tenant.id);
                    setTenantDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    selectedTenant === tenant.id 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{tenant.name}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
                    {tenant.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{currentTenantObj.name}</span>
              <span>/</span>
              <span className="capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Search Trigger */}
            <button 
              onClick={() => navigate('/contracts')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search contracts, clauses...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 font-mono">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-xs font-bold">Notifications</span>
                    <span className="text-[10px] text-blue-600 font-medium">Mark all read</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                      <p className="font-semibold text-amber-900 dark:text-amber-300">High Risk Contract Flagged</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">MSA - Uncapped Indemnity requires approval before SAP write.</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                      <p className="font-semibold text-blue-900 dark:text-blue-300">Prompt Injection Blocked</p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400">Footnote 47 sanitized by safety classifier.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile Avatar */}
            <div className="relative border-l border-gray-200 dark:border-gray-800 pl-3">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  RA
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Rajat Murhe</p>
                  <p className="text-[10px] text-gray-400 font-medium">Legal Tech Admin</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold">Rajat Murhe</p>
                    <p className="text-[10px] text-gray-400">rajat@contractiq.io</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    <User className="h-3.5 w-3.5" /> Account Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition">
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
