import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, Users, ShieldAlert, Cpu, Home, 
  GraduationCap, Sparkles, RefreshCw, Key, ToggleLeft, 
  ToggleRight, Trash2, UserPlus, FileText, Database, Search,
  Wallet, Plus, Edit2, Filter, CalendarDays, Receipt,
  PieChart as PieChartIcon, BarChart2, ArrowDownRight, ArrowUpRight,
  IndianRupee, Fuel, Wifi, Zap, UtensilsCrossed, Car, Package, Megaphone, Monitor, MoreHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';
import { formatINR, formatDateStr } from '../../utils/formatters';
import { ExpensesTab } from '../../components/ui/ExpensesTab';

// ==========================================
// TYPES
// ==========================================

interface BusinessStats {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  revenue: number;
  pending: number;
  keyCount: number;
  label: string;
  expenses: number;
}

interface UserRecord {
  id: string;
  userId: string;
  role: 'ADMIN' | 'USER';
  businessName: string;
  businessSlug: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  business: string;
  actionType: string;
  recordName: string;
  timestamp: string;
}

interface Expense {
  id: string;
  business_slug: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  payment_mode: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// Expense categories with icons
const EXPENSE_CATEGORIES = [
  'Petrol', 'Rent', 'WiFi', 'Electricity', 'Salary', 
  'Food', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other'
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card'];

const BUSINESS_OPTIONS = [
  { slug: 'tech', label: 'Rturox Technology' },
  { slug: 'realestate', label: 'AadanaTharakar' },
  { slug: 'training', label: 'RturoxAcademy' },
  { slug: 'coaching', label: 'CKS Tuition' }
];

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  Petrol: Fuel,
  Rent: Home,
  WiFi: Wifi,
  Electricity: Zap,
  Salary: Users,
  Food: UtensilsCrossed,
  Travel: Car,
  'Office Supplies': Package,
  Marketing: Megaphone,
  Software: Monitor,
  Other: MoreHorizontal
};

const CATEGORY_COLORS: Record<string, string> = {
  Petrol: 'text-orange-400',
  Rent: 'text-blue-400',
  WiFi: 'text-cyan-400',
  Electricity: 'text-yellow-400',
  Salary: 'text-purple-400',
  Food: 'text-green-400',
  Travel: 'text-pink-400',
  'Office Supplies': 'text-slate-400',
  Marketing: 'text-red-400',
  Software: 'text-indigo-400',
  Other: 'text-slate-500'
};

const PIE_COLORS = ['#f97316', '#3b82f6', '#06b6d4', '#eab308', '#a855f7', '#22c55e', '#ec4899', '#64748b', '#ef4444', '#6366f1', '#94a3b8'];

export const AdminDashboard: React.FC = () => {
  // Admin tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');

  // Overview data
  const [overview, setOverview] = useState<{ grandTotalRevenue: number; grandTotalPending: number; grandTotalExpenses: number; businessTiles: BusinessStats[] } | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Expense states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseSlugFilter, setExpenseSlugFilter] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseMonthFilter, setExpenseMonthFilter] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; editRecord: Expense | null }>({ open: false, editRecord: null });

  // Custom category input state
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Forms
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  useEffect(() => {
    if (globalSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get(`/admin/global-search?q=${globalSearch}`);
        if (res.data.success) setSearchResults(res.data.data);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  // Forms state
  const [newUser, setNewUser] = useState({ userId: '', passcode: '', role: 'USER', businessId: '' });
  const [pinChange, setPinChange] = useState({ userId: '', newPasscode: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overRes, usersRes, actRes, revRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/activity'),
        apiClient.get('/admin/revenue')
      ]);

      if (overRes.data.success) setOverview(overRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (actRes.data.success) setActivities(actRes.data.data);
      if (revRes.data.success) setRevenueData(revRes.data.data);
    } catch (e) {
      toast.error('Failed to load admin consolidated logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const params: any = {};
      if (expenseSlugFilter) params.slug = expenseSlugFilter;
      if (expenseCategoryFilter) params.category = expenseCategoryFilter;
      if (expenseMonthFilter) params.month = expenseMonthFilter;

      const [listRes, summaryRes] = await Promise.all([
        apiClient.get('/expenses', { params }),
        apiClient.get('/expenses/summary/all')
      ]);

      if (listRes.data.success) setExpenses(listRes.data.data);
      if (summaryRes.data.success) setExpenseSummary(summaryRes.data.data);
    } catch (e) {
      toast.error('Failed to load expenses.');
    } finally {
      setExpenseLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab, expenseSlugFilter, expenseCategoryFilter, expenseMonthFilter]);

  // --- OVERVIEW HANDLERS ---

  const handleToggleBusiness = async (bizId: string, currentStatus: boolean) => {
    try {
      const res = await apiClient.post('/admin/business/toggle', {
        businessId: bizId,
        isActive: !currentStatus
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to toggle business visibility.');
    }
  };

  const handleResetBusiness = async (slug: string) => {
    if (!window.confirm(`Are you absolutely sure? This will wipe ALL database records belonging to ${slug.toUpperCase()}! This cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await apiClient.post('/admin/business/reset', { slug });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (e) {
      toast.error('Database wipe command failed.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.userId || !newUser.passcode) {
      toast.error('User ID and Passcode PIN are required.');
      return;
    }

    try {
      const res = await apiClient.post('/admin/users', newUser);
      if (res.data.success) {
        toast.success(res.data.message);
        setNewUser({ userId: '', passcode: '', role: 'USER', businessId: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user account.');
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinChange.userId || !pinChange.newPasscode) {
      toast.error('Please pick a user profile and input the new 6-digit passcode PIN.');
      return;
    }

    try {
      const res = await apiClient.post('/admin/users/passcode', pinChange);
      if (res.data.success) {
        toast.success(res.data.message);
        setPinChange({ userId: '', newPasscode: '' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Passcode override failed.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete user profile? This user will lose dashboard session credentials.')) {
      return;
    }

    try {
      const res = await apiClient.delete(`/admin/users/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (e) {
      toast.error('User profile deletion failed.');
    }
  };

  // --- EXPENSE HANDLERS ---

  const handleExpenseSubmit = async (data: any) => {
    try {
      // Resolve the category — if custom category is typed, use it
      const finalCategory = showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : data.category;

      if (!finalCategory) {
        toast.error('Please select or type an expense category.');
        return;
      }

      const payload = {
        ...data,
        category: finalCategory,
        amount: Number(data.amount || 0)
      };

      let res;
      if (expenseModal.editRecord) {
        res = await apiClient.put(`/expenses/${expenseModal.editRecord.id}`, payload);
      } else {
        res = await apiClient.post('/expenses', payload);
      }

      if (res.data.success) {
        toast.success(expenseModal.editRecord ? 'Expense updated!' : 'Expense added!');
        setExpenseModal({ open: false, editRecord: null });
        setCustomCategory('');
        setShowCustomCategory(false);
        reset();
        fetchExpenses();
        fetchData(); // Refresh overview tiles too
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      const res = await apiClient.delete(`/expenses/${id}`);
      if (res.data.success) {
        toast.success('Expense deleted.');
        fetchExpenses();
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to delete expense.');
    }
  };

  const openEditExpenseModal = (exp: Expense) => {
    const isCustom = !EXPENSE_CATEGORIES.includes(exp.category);
    setShowCustomCategory(isCustom);
    setCustomCategory(isCustom ? exp.category : '');
    
    reset({
      business_slug: exp.business_slug,
      category: isCustom ? '' : exp.category,
      amount: Number(exp.amount),
      description: exp.description || '',
      date: exp.date ? exp.date.split('T')[0] : '',
      payment_mode: exp.payment_mode || '',
      notes: exp.notes || ''
    });
    setExpenseModal({ open: true, editRecord: exp });
  };

  // --- FILTERED EXPENSES ---
  const filteredExpenses = expenses.filter(exp => {
    if (!expenseSearch) return true;
    const q = expenseSearch.toLowerCase();
    return (
      exp.category.toLowerCase().includes(q) ||
      (exp.description && exp.description.toLowerCase().includes(q)) ||
      (exp.notes && exp.notes.toLowerCase().includes(q)) ||
      exp.business_slug.toLowerCase().includes(q) ||
      String(exp.amount).includes(q)
    );
  });

  // --- LOADING STATE ---
  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold tracking-wider">Syncing Admin Nodes...</p>
      </div>
    );
  }

  const customTooltipINR = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121a] border border-brand-border p-3 rounded-lg shadow-xl">
          <p className="text-xs font-bold text-slate-300 font-heading mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
              {p.name}: {formatINR(p.value)}
            </p>
          ))}
          <p className="text-xs font-bold text-white border-t border-brand-border/40 mt-1.5 pt-1.5">
            Total: {formatINR(payload.reduce((sum: number, p: any) => sum + Number(p.value), 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get business label from slug
  const getBizLabel = (slug: string) => BUSINESS_OPTIONS.find(b => b.slug === slug)?.label || slug;

  // Get the category icon component
  const getCategoryIcon = (cat: string) => CATEGORY_ICONS[cat] || MoreHorizontal;

  return (
    <div className="space-y-8 select-none">
      
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'overview', label: 'Operations Center', icon: BarChart2 },
            { key: 'expenses', label: 'Expense Tracker', icon: Wallet }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 focus:outline-none ${
                  activeTab === tab.key
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { fetchData(); if (activeTab === 'expenses') fetchExpenses(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Nodes
        </button>
      </div>

      {/* ============================================================
          TAB: OVERVIEW (existing content)
          ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          {/* Global Revenue Hero */}
          {overview && (
            <RevenueHeroCard
              collected={overview.grandTotalRevenue}
              pending={overview.grandTotalPending}
              growthRate={24.8}
              type="admin"
            />
          )}

          {/* Grand Expense Summary Banner */}
          {overview && overview.grandTotalExpenses > 0 && (
            <div className="w-full bg-[#161623]/80 border border-rose-500/20 hover:border-rose-500/40 rounded-3xl p-5 backdrop-blur-md shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40">
                    <ArrowDownRight className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Expenses (All Businesses)</p>
                    <p className="text-lg font-black text-rose-400 font-heading">{formatINR(overview.grandTotalExpenses)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Net Profit (Revenue − Expenses)</p>
                    <p className="text-lg font-black text-emerald-400 font-heading">{formatINR(overview.grandTotalRevenue - overview.grandTotalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stacked Revenue Bar Chart */}
          <div className="w-full bg-[#161623]/80 border border-brand-border/60 hover:border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-lg transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading mb-6 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
              Consolidated Monthly Revenue (Stacked)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a/40" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip content={customTooltipINR} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="Rturox Technology" stackId="a" fill="#6c63ff" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="AadanaTharakar" stackId="a" fill="#ff6b6b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="RturoxAcademy" stackId="a" fill="#43e97b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="CKS Tuition" stackId="a" fill="#f7b731" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Business Control Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {overview?.businessTiles.map((biz) => {
              let AccentIcon = Cpu;
              let colorClass = 'text-brand-tech';
              let borderHover = 'hover:border-brand-tech/40';
              let bgGradient = 'from-brand-tech/5 to-transparent';

              if (biz.slug === 'realestate') {
                AccentIcon = Home;
                colorClass = 'text-brand-re';
                borderHover = 'hover:border-brand-re/40';
                bgGradient = 'from-brand-re/5 to-transparent';
              } else if (biz.slug === 'training') {
                AccentIcon = GraduationCap;
                colorClass = 'text-brand-training';
                borderHover = 'hover:border-brand-training/40';
                bgGradient = 'from-brand-training/5 to-transparent';
              } else if (biz.slug === 'coaching') {
                AccentIcon = Sparkles;
                colorClass = 'text-brand-coaching';
                borderHover = 'hover:border-brand-coaching/40';
                bgGradient = 'from-brand-coaching/5 to-transparent';
              }

              const netProfit = biz.revenue - biz.expenses;

              return (
                <div
                  key={biz.id}
                  className={`rounded-2xl border border-brand-border/60 bg-brand-card bg-gradient-to-tr ${bgGradient} p-5 ${borderHover} transition-all duration-300 flex flex-col justify-between gap-5 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg bg-slate-900 border border-brand-border ${colorClass}`}>
                        <AccentIcon className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 font-heading">
                          {biz.name}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-semibold tracking-wider mt-0.5">
                          SLUG: {biz.slug.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Active status Toggle Switch */}
                    <button
                      onClick={() => handleToggleBusiness(biz.id, biz.isActive)}
                      className="focus:outline-none"
                      title={`Toggle dashboard ${biz.isActive ? 'OFF' : 'ON'}`}
                    >
                      {biz.isActive ? (
                        <ToggleRight className="w-9 h-9 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Data Summary Grid — now includes Expenses + Net */}
                  <div className="grid grid-cols-5 gap-2 bg-brand-dark/40 border border-brand-border/20 rounded-xl p-3.5">
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Collected</p>
                      <p className="text-xs font-black text-emerald-400 mt-1">{formatINR(biz.revenue)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending</p>
                      <p className="text-xs font-black text-amber-400 mt-1">{formatINR(biz.pending)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Expenses</p>
                      <p className="text-xs font-black text-rose-400 mt-1">{formatINR(biz.expenses)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Net</p>
                      <p className={`text-xs font-black mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatINR(netProfit)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{biz.label}</p>
                      <p className="text-xs font-black text-slate-200 mt-1">{biz.keyCount}</p>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-border/20 justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      biz.isActive 
                        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' 
                        : 'bg-rose-950/20 text-rose-400 border border-rose-900/30'
                    }`}>
                      {biz.isActive ? 'Active Pipeline' : 'Deactivated Dashboard'}
                    </span>
                    
                    <button
                      onClick={() => handleResetBusiness(biz.slug)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset Data
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* User Management & Passcode Reset */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User Account Registry list */}
            <div className="lg:col-span-2 rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-indigo-400" />
                Decrypted User Accounts Registry
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-300">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-slate-400">
                      <th className="py-2.5">User ID</th>
                      <th className="py-2.5">Security Role</th>
                      <th className="py-2.5">Authorized Tenant</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/10">
                        <td className="py-3 font-bold text-white">{u.userId}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            u.role === 'ADMIN' 
                              ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' 
                              : 'bg-blue-950/20 text-blue-400 border-blue-900/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{u.businessName}</td>
                        <td className="py-3 text-right">
                          {u.userId !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 rounded hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 text-rose-400 hover:text-rose-300 transition-all duration-150"
                              title="Revoke and delete user credentials"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Creation & Passcode panels */}
            <div className="space-y-6">
              
              {/* Create User Form */}
              <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-heading flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  Add User Profile
                </h4>
                <form onSubmit={handleCreateUser} className="space-y-3.5">
                  <input
                    type="text"
                    value={newUser.userId}
                    onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                    placeholder="User ID credential"
                    className="w-full p-2.5 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80"
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={newUser.passcode}
                    onChange={(e) => setNewUser({ ...newUser, passcode: e.target.value })}
                    placeholder="6-Digit passcode PIN"
                    className="w-full p-2.5 bg-slate-900 border border-brand-border/60 rounded-xl text-xs tracking-widest font-mono text-slate-200 focus:outline-none focus:border-indigo-500/80"
                  />
                  <select
                    value={newUser.businessId}
                    onChange={(e) => setNewUser({ ...newUser, businessId: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80"
                  >
                    <option value="">Select Tenant Pipeline</option>
                    {overview?.businessTiles.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Provision Account
                  </button>
                </form>
              </div>

              {/* Override Passcode Form */}
              <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-heading flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Override PIN Passcode
                </h4>
                <form onSubmit={handlePinChange} className="space-y-3.5">
                  <select
                    value={pinChange.userId}
                    onChange={(e) => setPinChange({ ...pinChange, userId: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80"
                  >
                    <option value="">Select User Profile</option>
                    {users.map(u => (
                      <option key={u.id} value={u.userId}>
                        {u.userId} ({u.businessSlug === 'admin' ? 'ADMIN' : u.businessName.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinChange.newPasscode}
                    onChange={(e) => setPinChange({ ...pinChange, newPasscode: e.target.value })}
                    placeholder="New 6-Digit passcode PIN"
                    className="w-full p-2.5 bg-slate-900 border border-brand-border/60 rounded-xl text-xs tracking-widest font-mono text-slate-200 focus:outline-none focus:border-indigo-500/80"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-brand-border transition-colors"
                  >
                    Override Passcode PIN
                  </button>
                </form>
              </div>

            </div>
          </div>

          {/* Global Activity Feed */}
          <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              Global Operational Audit Stream (Last 50 Events)
            </h3>

            <div className="max-h-72 overflow-y-auto divide-y divide-brand-border/20 border border-brand-border/20 rounded-xl bg-brand-dark/20">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No audit logs captured.
                </div>
              ) : (
                activities.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        log.actionType === 'CREATE' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' :
                        log.actionType === 'UPDATE' ? 'bg-amber-950/20 text-amber-400 border border-amber-900/30' :
                        log.actionType === 'DELETE' ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' :
                        'bg-indigo-950/20 text-indigo-400 border border-indigo-900/30'
                      }`}>
                        {log.actionType}
                      </span>
                      <div>
                        <p className="text-slate-200 leading-snug">{log.recordName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Executed by: <span className="text-slate-400">{log.userId}</span> | Area: <span className="text-slate-400">{log.business}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {formatDateStr(log.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================
          TAB: EXPENSE TRACKER
          ============================================================ */}
      {activeTab === 'expenses' && (
        <ExpensesTab onSave={fetchData} />
      )}

    </div>
  );
};
export default AdminDashboard;
