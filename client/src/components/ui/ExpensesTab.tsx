import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Search, Filter, CalendarDays, Wallet,
  Receipt, ArrowDownRight, IndianRupee, Fuel, Home, Wifi, Zap, Users,
  UtensilsCrossed, Car, Package, Megaphone, Monitor, MoreHorizontal,
  RefreshCw, PieChart as PieChartIcon, BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatINR, formatDateStr } from '../../utils/formatters';

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

interface ExpensesTabProps {
  businessSlug?: 'tech' | 'realestate' | 'training' | 'coaching';
  onSave?: () => void;
}

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
  'Office Supplies': 'text-emerald-400',
  Marketing: 'text-indigo-400',
  Software: 'text-teal-400',
  Other: 'text-slate-400'
};

const PIE_COLORS = [
  '#f97316', '#3b82f6', '#06b6d4', '#eab308', '#a855f7', 
  '#22c55e', '#ec4899', '#10b981', '#6366f1', '#14b8a6', '#64748b'
];

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ businessSlug, onSave }) => {
  const { user } = useAuthStore();
  const activeSlug = businessSlug || (user?.role !== 'ADMIN' ? user?.businessSlug : undefined);
  const isScoped = !!activeSlug;

  // States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);

  // Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseSlugFilter, setExpenseSlugFilter] = useState(activeSlug || '');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseMonthFilter, setExpenseMonthFilter] = useState('');

  // Modal State
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; editRecord: Expense | null }>({ open: false, editRecord: null });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (expenseSlugFilter) params.slug = expenseSlugFilter;
      if (expenseCategoryFilter) params.category = expenseCategoryFilter;
      if (expenseMonthFilter) params.month = expenseMonthFilter;

      const res = await apiClient.get('/expenses', { params });
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to sync expense logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const params: any = {};
      if (expenseMonthFilter) params.month = expenseMonthFilter;
      
      const res = await apiClient.get('/expenses/summary/all', { params });
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch expense summary charts data:', e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [expenseSlugFilter, expenseCategoryFilter, expenseMonthFilter]);

  useEffect(() => {
    fetchSummary();
  }, [expenseMonthFilter]);

  const handleExpenseSubmit = async (data: any) => {
    try {
      const finalCategory = showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : data.category;

      if (!finalCategory) {
        toast.error('Please select or type an expense category.');
        return;
      }

      const payload = {
        ...data,
        business_slug: activeSlug || data.business_slug,
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
        fetchSummary();
        onSave?.();
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
        fetchSummary();
        onSave?.();
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

  const openAddModal = () => {
    setShowCustomCategory(false);
    setCustomCategory('');
    reset({
      business_slug: activeSlug || '',
      category: 'Petrol',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_mode: 'UPI',
      notes: ''
    });
    setExpenseModal({ open: true, editRecord: null });
  };

  // Filtered local list
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

  const getBizLabel = (slug: string) => BUSINESS_OPTIONS.find(b => b.slug === slug)?.label || slug;
  const getCategoryIcon = (cat: string) => CATEGORY_ICONS[cat] || MoreHorizontal;

  // Scoped computations
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Recharts local charts if scoped
  const scopedCategoryData = Object.entries(
    filteredExpenses.reduce((acc: Record<string, number>, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const localMonthlyData = months.map((m, idx) => {
    const monthlyExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    });
    const total = monthlyExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    return {
      name: m,
      [getBizLabel(activeSlug || '') || 'Expenses']: total
    };
  });

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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card border border-rose-500/20 rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Active Expenses</p>
              <p className="text-2xl font-black text-rose-400 font-heading">{formatINR(totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-indigo-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Transactions</p>
              <p className="text-2xl font-black text-slate-200 font-heading">{filteredExpenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300">Track New Expense</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Log every ₹1 manually with categories.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scoped Category Breakdown */}
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider font-heading">Category Share</h4>
              </div>
            </div>
            <div className="flex-1 min-h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={scopedCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {scopedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatINR(value)} />
                </RePie>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 max-h-[80px] overflow-y-auto">
              {scopedCategoryData.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span>{item.name} ({formatINR(item.value)})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider font-heading">Monthly Expense Trend</h4>
              </div>
            </div>
            <div className="flex-grow min-h-[220px]">
              {expenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary && summary.monthlyData ? summary.monthlyData : localMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} tickLine={false} />
                    <Tooltip content={customTooltipINR} />
                    <Bar 
                      dataKey={isScoped ? getBizLabel(activeSlug) : "Grand Total"} 
                      fill="#f43f5e" 
                      radius={[4, 4, 0, 0]} 
                      name="Expenses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                  No data loaded
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense Logs Section */}
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-md">
        {/* Filters */}
        <div className="p-5 border-b border-brand-border/60 bg-brand-card/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Search Bar */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search description, notes, custom category..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>

            {/* Business filter - Admin only */}
            {!isScoped && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select
                  value={expenseSlugFilter}
                  onChange={(e) => setExpenseSlugFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 rounded-xl text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none"
                >
                  <option value="">All Businesses</option>
                  {BUSINESS_OPTIONS.map(b => (
                    <option key={b.slug} value={b.slug}>{b.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="pl-8 pr-4 py-2 rounded-xl text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={expenseMonthFilter}
                onChange={(e) => setExpenseMonthFilter(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-xl text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => { fetchExpenses(); fetchSummary(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all duration-200"
            title="Refresh Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-xs text-slate-500 font-bold">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
              Syncing Ledger...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold">
              No expenses matching filters found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#12121a] text-slate-400 font-semibold uppercase tracking-wider border-b border-brand-border/40">
                <tr>
                  <th className="px-6 py-4">Expense Details</th>
                  {!isScoped && <th className="px-6 py-4">Business</th>}
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredExpenses.map((exp) => {
                  const Icon = getCategoryIcon(exp.category);
                  const colorClass = CATEGORY_COLORS[exp.category] || 'text-slate-400';
                  return (
                    <tr key={exp.id} className="hover:bg-brand-dark/20 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-bold text-slate-200 truncate">{exp.description || 'General Business Expense'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{formatDateStr(exp.date)}</p>
                      </td>
                      {!isScoped && (
                        <td className="px-6 py-4 font-semibold text-slate-400">
                          {getBizLabel(exp.business_slug)}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${colorClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-400">
                        {exp.payment_mode || 'UPI'}
                      </td>
                      <td className="px-6 py-4 font-black text-rose-400 font-heading">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============================================================
          EXPENSE MODAL
          ============================================================ */}
      {expenseModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-brand-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-brand-border/60 bg-[#161623]/60 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest font-heading">
                {expenseModal.editRecord ? 'Modify Expense Node' : 'Record New Expense'}
              </h3>
              <button 
                onClick={() => setExpenseModal({ open: false, editRecord: null })} 
                className="text-slate-500 hover:text-slate-300 text-lg focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(handleExpenseSubmit)} className="p-6 space-y-4">
              {/* Business Select - Admin only */}
              {!isScoped && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Business</label>
                  <select
                    {...register('business_slug', { required: true })}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="">Select Target Business...</option>
                    {BUSINESS_OPTIONS.map(b => (
                      <option key={b.slug} value={b.slug}>{b.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category selector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    {...register('category')}
                    disabled={showCustomCategory}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200 disabled:opacity-40"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Category</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="customCategoryCheck"
                      checked={showCustomCategory}
                      onChange={(e) => {
                        setShowCustomCategory(e.target.checked);
                        if (!e.target.checked) setCustomCategory('');
                      }}
                      className="w-4 h-4 rounded border-brand-border bg-brand-dark"
                    />
                    <label htmlFor="customCategoryCheck" className="text-[10px] font-semibold text-slate-300 cursor-pointer">
                      Use Custom Input
                    </label>
                  </div>
                </div>
              </div>

              {/* Custom Category Input field */}
              {showCustomCategory && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type Custom Category Name</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. WiFi Bill, Tea & Snacks, Domain Renewal"
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₹ 0.00"
                    {...register('amount', { required: true, min: 1 })}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200 font-heading"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    {...register('date', { required: true })}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Petrol for visiting clients"
                    {...register('description')}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</label>
                  <select
                    {...register('payment_mode')}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    {PAYMENT_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Notes (Optional)</label>
                <textarea
                  placeholder="Additional context/details..."
                  rows={2}
                  {...register('notes')}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-dark/60 border border-brand-border/80 focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={() => setExpenseModal({ open: false, editRecord: null })}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200"
                >
                  {expenseModal.editRecord ? 'Save Changes' : 'Log Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
