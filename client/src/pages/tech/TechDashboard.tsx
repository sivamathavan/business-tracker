import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Edit2, Trash2, Pin, Calendar, User, 
  DollarSign, FileText, BarChart2, PieChart, KanbanSquare, 
  FileSpreadsheet, FileDown, Phone, Briefcase, ListTodo, CalendarDays, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatINR, formatDateStr, formatMobileStr } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';
import { KanbanBoard, KanbanCardData } from '../../components/ui/KanbanBoard';
import { ExpensesTab } from '../../components/ui/ExpensesTab';

// ==========================================
// TYPES DEFINITIONS
// ==========================================
interface Project {
  project_id: string;
  project_name: string;
  client_name: string;
  client_mobile: string | null;
  project_type: 'Website' | 'Web App' | 'Mobile App' | 'Automation' | 'Marketing';
  status: 'Lead' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
  priority: 'High' | 'Medium' | 'Low';
  start_date: string | null;
  deadline_date: string | null;
  delivery_date: string | null;
  total_amount: number;
  amount_received: number;
  notes: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  project_name: string;
  amount: number;
  date_sent: string | null;
  due_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  notes: string | null;
}

interface Proposal {
  proposal_id: string;
  lead_name: string;
  lead_mobile: string | null;
  service_type: 'Website' | 'Web App' | 'Mobile App' | 'Automation' | 'Marketing';
  proposal_value: number;
  date_sent: string | null;
  followup_date: string | null;
  status: 'Sent' | 'Followed Up' | 'Won' | 'Lost';
  notes: string | null;
}

export const TechDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'milestones' | 'clients' | 'invoices' | 'proposals' | 'analytics' | 'expenses'>('projects');
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  
  // Milestones State
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Visual View states
  const [proposalView, setProposalView] = useState<'kanban' | 'table'>('kanban');

  const [projectModal, setProjectModal] = useState<{ open: boolean; editRecord: Project | null }>({ open: false, editRecord: null });
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; editRecord: Invoice | null }>({ open: false, editRecord: null });
  const [proposalModal, setProposalModal] = useState<{ open: boolean; editRecord: Proposal | null }>({ open: false, editRecord: null });
  const [milestoneModal, setMilestoneModal] = useState<{ open: boolean; editRecord: any | null }>({ open: false, editRecord: null });

  // Forms Hook
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, invRes, propRes, anaRes] = await Promise.all([
        apiClient.get('/tech/projects'),
        apiClient.get('/tech/invoices'),
        apiClient.get('/tech/proposals'),
        apiClient.get('/tech/analytics')
      ]);

      if (projRes.data.success) setProjects(projRes.data.data);
      if (invRes.data.success) setInvoices(invRes.data.data);
      if (propRes.data.success) setProposals(propRes.data.data);
      if (anaRes.data.success) setAnalytics(anaRes.data.analytics);

      // Check for overdue alerts dynamically and push them to the notifications state in authStore
      const overdueProj = projRes.data.data.filter((p: Project) => {
        const hasBalance = p.total_amount - p.amount_received > 0;
        const isPastDeadline = p.deadline_date && new Date(p.deadline_date) < new Date();
        return hasBalance && isPastDeadline && p.status !== 'Completed';
      });

      const alerts = overdueProj.map((p: Project) => ({
        id: `proj-overdue-${p.project_id}`,
        title: `Overdue Project Balance!`,
        message: `Project "${p.project_name}" for ${p.client_name} is overdue. Balance due: ${formatINR(p.total_amount - p.amount_received)}`,
        type: 'warning',
        section: 'Rturox Tech'
      }));

      useAuthStore.getState().setNotifications(alerts);
    } catch (e) {
      toast.error('Failed to sync tech pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'milestones' && selectedProjectId) {
      fetchMilestones(selectedProjectId);
    }
  }, [activeTab, selectedProjectId]);

  const fetchMilestones = async (projectId: string) => {
    try {
      const res = await apiClient.get(`/tech/projects/${projectId}/milestones`);
      if (res.data.success) setMilestones(res.data.data);
    } catch (e) {
      toast.error('Failed to load milestones.');
    }
  };

  // --- FORM HANDLERS ---
  const handleProjectSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        total_amount: Number(data.total_amount || 0),
        amount_received: Number(data.amount_received || 0)
      };

      let res;
      if (projectModal.editRecord) {
        res = await apiClient.put(`/tech/projects/${projectModal.editRecord.project_id}`, payload);
      } else {
        res = await apiClient.post('/tech/projects', payload);
      }

      if (res.data.success) {
        toast.success(projectModal.editRecord ? 'Project updated!' : 'Project created!');
        setProjectModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save project.');
    }
  };

  const handleInvoiceSubmit = async (data: any) => {
    try {
      let res;
      if (invoiceModal.editRecord) {
        res = await apiClient.put(`/tech/invoices/${invoiceModal.editRecord.invoice_id}`, data);
      } else {
        res = await apiClient.post('/tech/invoices', data);
      }

      if (res.data.success) {
        toast.success(invoiceModal.editRecord ? 'Invoice modified!' : 'Invoice generated!');
        setInvoiceModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save invoice.');
    }
  };

  const handleProposalSubmit = async (data: any) => {
    try {
      let res;
      if (proposalModal.editRecord) {
        res = await apiClient.put(`/tech/proposals/${proposalModal.editRecord.proposal_id}`, data);
      } else {
        res = await apiClient.post('/tech/proposals', data);
      }

      if (res.data.success) {
        toast.success(proposalModal.editRecord ? 'Proposal updated!' : 'Proposal created!');
        setProposalModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save proposal.');
    }
  };

  const handleMilestoneSubmit = async (data: any) => {
    try {
      let res;
      if (milestoneModal.editRecord) {
        res = await apiClient.put(`/tech/projects/milestones/${milestoneModal.editRecord.id}`, data);
      } else {
        res = await apiClient.post('/tech/projects/milestones', { ...data, project_id: selectedProjectId });
      }

      if (res.data.success) {
        toast.success(milestoneModal.editRecord ? 'Milestone updated!' : 'Milestone created!');
        setMilestoneModal({ open: false, editRecord: null });
        if (selectedProjectId) fetchMilestones(selectedProjectId);
      }
    } catch (e) {
      toast.error('Failed to save milestone.');
    }
  };

  // --- PIN CONTROL ---
  const handlePinProject = async (proj: Project) => {
    try {
      const res = await apiClient.put(`/tech/projects/${proj.project_id}`, {
        is_pinned: !proj.is_pinned
      });
      if (res.data.success) {
        toast.success(proj.is_pinned ? 'Project unpinned' : 'Project pinned to top!');
        fetchData();
      }
    } catch (e) {
      toast.error('Pin action failed.');
    }
  };

  // --- DELETE CONTROLS ---
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await apiClient.delete(`/tech/projects/${id}`);
      if (res.data.success) {
        toast.success('Project soft-deleted.');
        fetchData();
      }
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      const res = await apiClient.delete(`/tech/invoices/${id}`);
      if (res.data.success) {
        toast.success('Invoice deleted.');
        fetchData();
      }
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!window.confirm('Delete this proposal?')) return;
    try {
      const res = await apiClient.delete(`/tech/proposals/${id}`);
      if (res.data.success) {
        toast.success('Proposal deleted.');
        fetchData();
      }
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      const res = await apiClient.delete(`/tech/projects/milestones/${id}`);
      if (res.data.success) {
        toast.success('Milestone deleted.');
        if (selectedProjectId) fetchMilestones(selectedProjectId);
      }
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  // --- KANBAN STATUS UPDATES ---
  const handleProposalStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await apiClient.put(`/tech/proposals/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Proposal moved to: ${newStatus}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to shift proposal status.');
    }
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client_mobile && p.client_mobile.includes(searchTerm));
    
    const matchesType = typeFilter ? p.project_type === typeFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    // Pinned records are always forced at the top
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    let aValue = a[sortField];
    let bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Pagination bounds
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- GROUP PROJECTS BY CLIENT ---
  const groupedClients = projects.reduce<Record<string, { name: string; mobile: string | null; projects: Project[] }>>((acc, p) => {
    if (!acc[p.client_name]) {
      acc[p.client_name] = {
        name: p.client_name,
        mobile: p.client_mobile,
        projects: []
      };
    }
    acc[p.client_name].projects.push(p);
    return acc;
  }, {});

  // --- EXPORT CONTROLS ---
  const handleExportCSV = () => {
    const exportData = filteredProjects.map(p => ({
      'Project ID': p.project_id,
      'Project Name': p.project_name,
      'Client Name': p.client_name,
      'Client Mobile': p.client_mobile || '',
      'Project Type': p.project_type,
      'Status': p.status,
      'Priority': p.priority,
      'Deadline': p.deadline_date ? new Date(p.deadline_date).toLocaleDateString() : '',
      'Total Amount': p.total_amount,
      'Amount Received': p.amount_received,
      'Balance Due': p.total_amount - p.amount_received
    }));
    exportToCSV(exportData, 'rturox_tech_projects');
  };

  const handleExportPDF = () => {
    const headers = ['Project', 'Client', 'Type', 'Status', 'Priority', 'Deadline', 'Total Amount', 'Received'];
    const rows = filteredProjects.map(p => [
      p.project_name,
      p.client_name,
      p.project_type,
      p.status,
      p.priority,
      formatDateStr(p.deadline_date),
      formatINR(p.total_amount),
      formatINR(p.amount_received)
    ]);
    exportToPDF('Rturox Tech Projects Pipeline', headers, rows, 'rturox_tech_pipeline', [108, 99, 255]);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-8 h-8 border-4 border-brand-tech border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold tracking-wider">Loading Tech Dashboard...</p>
      </div>
    );
  }

  // Kanban Proposals cards mapping
  const kanbanCards: KanbanCardData[] = proposals.map((prop) => ({
    id: prop.proposal_id,
    title: prop.lead_name,
    subtitle: `${prop.service_type} - ${prop.notes || 'No description'}`,
    value: Number(prop.proposal_value),
    dateLabel: 'Followup',
    dateValue: prop.followup_date,
    mobile: prop.lead_mobile,
    status: prop.status,
    rawRecord: prop
  }));

  // Pie chart variables
  const COLORS = ['#6c63ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      
      {/* Dashboard Sub-navigation tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-brand-border/40 scrollbar-none print-hidden">
        {[
          { key: 'projects', label: 'Projects Pipeline', icon: Briefcase },
          { key: 'milestones', label: 'Tech Milestones', icon: ListTodo },
          { key: 'clients', label: 'Client Portals', icon: User },
          { key: 'invoices', label: 'Invoices Hub', icon: FileText },
          { key: 'proposals', label: 'Proposals Kanban', icon: KanbanSquare },
          { key: 'analytics', label: 'Revenue Analytics', icon: BarChart2 },
          { key: 'expenses', label: 'Expense Tracker', icon: Wallet }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 focus:outline-none ${
                activeTab === tab.key
                  ? 'bg-brand-tech/10 text-brand-tech border border-brand-tech/30 shadow-[0_0_10px_rgba(108,99,255,0.1)]'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Revenue Card Hero */}
      {analytics && (
        <RevenueHeroCard
          collected={analytics.totalCollected}
          pending={analytics.totalPending}
          growthRate={analytics.growthRate}
          type="tech"
        />
      )}

      {/* =======================================================================
          TAB 1: PROJECTS HUB
          ======================================================================= */}
      {activeTab === 'projects' && (
        <div className="space-y-5">
          {/* Table utility filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search project or client..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-brand-border/60 hover:border-slate-800 focus:border-brand-tech/80 rounded-xl text-xs text-slate-200 focus:outline-none transition-colors"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Services</option>
                <option value="Website">Website</option>
                <option value="Web App">Web App</option>
                <option value="Mobile App">Mobile App</option>
                <option value="Automation">Automation</option>
                <option value="Marketing">Marketing</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Lead">Lead</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Creation & Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-brand-border/60 text-slate-400 hover:text-slate-100 transition-colors"
                title="Export list to CSV"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleExportPDF}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-brand-border/60 text-slate-400 hover:text-slate-100 transition-colors"
                title="Download formatted PDF report"
              >
                <FileDown className="w-4.5 h-4.5" />
              </button>
              
              <button
                onClick={() => {
                  reset({ amount_received: 0, total_amount: 0 });
                  setProjectModal({ open: true, editRecord: null });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all duration-200"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Project
              </button>
            </div>
          </div>

          {/* Core Projects Table Grid */}
          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md shadow-lg">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Project</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Received</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-center">WA</th>
                  <th className="p-4 text-right print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active projects match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p) => {
                    const balance = p.total_amount - p.amount_received;
                    let payStatus = 'Pending';
                    if (p.amount_received >= p.total_amount) {
                      payStatus = 'Paid';
                    } else if (p.amount_received > 0) {
                      payStatus = 'Partial';
                    }
                    if (payStatus !== 'Paid' && p.deadline_date && new Date(p.deadline_date) < new Date()) {
                      payStatus = 'Overdue';
                    }

                    return (
                      <tr 
                        key={p.project_id} 
                        className={`hover:bg-slate-800/10 group transition-colors ${
                          p.is_pinned ? 'bg-brand-tech/5 pulse-glow-purple' : ''
                        }`}
                      >
                        <td className="p-4 flex items-center gap-2">
                          <button
                            onClick={() => handlePinProject(p)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              p.is_pinned ? 'text-brand-tech' : 'text-slate-600 group-hover:text-slate-400'
                            }`}
                            title={p.is_pinned ? 'Unpin' : 'Pin to top of list'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-white max-w-[150px] truncate" title={p.project_name}>
                            {p.project_name}
                          </span>
                        </td>
                        <td className="p-4 text-slate-200">{p.client_name}</td>
                        <td className="p-4 text-slate-400">{p.project_type}</td>
                        <td className="p-4"><StatusBadge status={p.status} /></td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            p.priority === 'High' ? 'bg-rose-950/20 text-rose-400 border-rose-900/30' :
                            p.priority === 'Medium' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' :
                            'bg-slate-800 text-slate-400 border-slate-700/60'
                          }`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{formatDateStr(p.deadline_date)}</td>
                        <td className="p-4 text-white font-bold">{formatINR(p.total_amount)}</td>
                        <td className="p-4 text-emerald-400 font-bold">{formatINR(p.amount_received)}</td>
                        <td className="p-4 text-amber-400 font-bold">{formatINR(balance)}</td>
                        <td className="p-4"><StatusBadge status={payStatus} /></td>
                        <td className="p-4 text-center">
                          <WhatsAppButton mobile={p.client_mobile} />
                        </td>
                        <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              reset(p);
                              // Format string inputs for dates
                              if (p.start_date) setValue('start_date', p.start_date.split('T')[0]);
                              if (p.deadline_date) setValue('deadline_date', p.deadline_date.split('T')[0]);
                              if (p.delivery_date) setValue('delivery_date', p.delivery_date.split('T')[0]);
                              setProjectModal({ open: true, editRecord: p });
                            }}
                            className="p-1 text-slate-400 hover:text-brand-tech hover:bg-slate-800 rounded transition-colors"
                            title="Edit project record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.project_id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB: TECH MILESTONES
          ======================================================================= */}
      {activeTab === 'milestones' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
            <div className="flex items-center gap-3">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-80 p-2.5 bg-slate-900 border border-brand-border/60 hover:border-slate-800 focus:border-brand-tech/80 rounded-xl text-xs text-slate-200 focus:outline-none transition-colors"
              >
                <option value="">Select a Project...</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name} - {p.client_name}</option>
                ))}
              </select>
            </div>
            {selectedProjectId && (
              <button
                onClick={() => {
                  reset({ status: 'Pending' });
                  setMilestoneModal({ open: true, editRecord: null });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all duration-200"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Milestone
              </button>
            )}
          </div>

          {!selectedProjectId ? (
            <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider bg-brand-card/75 border border-brand-border/60 rounded-3xl">
              Please select a project to view its milestones.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {milestones.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 font-bold uppercase tracking-wider bg-brand-card/75 border border-brand-border/60 rounded-3xl">
                  No milestones added for this project yet.
                </div>
              ) : (
                milestones.map((m) => {
                  const isCompleted = m.status === 'Completed';
                  return (
                    <div key={m.id} className={`rounded-2xl border bg-brand-card p-5 space-y-4 hover:-translate-y-1 transition-transform duration-200 ${
                      isCompleted ? 'border-emerald-500/40 opacity-75' : 'border-brand-border/60'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          {m.description && (
                            <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              reset(m);
                              if (m.target_date) setValue('target_date', m.target_date.split('T')[0]);
                              if (m.completion_date) setValue('completion_date', m.completion_date.split('T')[0]);
                              setMilestoneModal({ open: true, editRecord: m });
                            }}
                            className="p-1 text-slate-400 hover:text-brand-tech rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Target: {formatDateStr(m.target_date)}
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                        {m.completion_date && (
                          <div className="text-[11px] font-semibold text-emerald-400">
                            Completed: {formatDateStr(m.completion_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 2: CLIENT PORTALS
          ======================================================================= */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(groupedClients).map((client) => {
            const billed = client.projects.reduce((sum, p) => sum + Number(p.total_amount), 0);
            const received = client.projects.reduce((sum, p) => sum + Number(p.amount_received), 0);
            const balance = billed - received;

            return (
              <div key={client.name} className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4 hover:border-brand-tech/40 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white font-heading">{client.name}</h3>
                    {client.mobile && (
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {formatMobileStr(client.mobile)}
                      </p>
                    )}
                  </div>
                  <WhatsAppButton mobile={client.mobile} showText={false} />
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-3 gap-2 text-center bg-brand-dark/40 border border-brand-border/20 rounded-xl p-3 text-[11px] font-bold">
                  <div>
                    <p className="text-slate-500 uppercase text-[9px] tracking-wider">Billed</p>
                    <p className="text-slate-200 font-extrabold mt-0.5">{formatINR(billed)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-[9px] tracking-wider">Collected</p>
                    <p className="text-emerald-400 font-extrabold mt-0.5">{formatINR(received)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase text-[9px] tracking-wider">Balance</p>
                    <p className="text-amber-400 font-extrabold mt-0.5">{formatINR(balance)}</p>
                  </div>
                </div>

                {/* Projects lists */}
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-heading">
                    Active Projects
                  </p>
                  <div className="divide-y divide-brand-border/20 max-h-36 overflow-y-auto">
                    {client.projects.map((proj) => (
                      <div key={proj.project_id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <p className="text-slate-200">{proj.project_name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{proj.project_type}</p>
                        </div>
                        <StatusBadge status={proj.status} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline and Quick Action */}
                <button
                  onClick={() => {
                    reset({ amount_received: 0, total_amount: 0 });
                    setValue('client_name', client.name);
                    if (client.mobile) setValue('client_mobile', client.mobile);
                    setProjectModal({ open: true, editRecord: null });
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase text-brand-tech bg-brand-tech/10 hover:bg-brand-tech/15 border border-brand-tech/20 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Project Directly
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* =======================================================================
          TAB 3: INVOICES HUB
          ======================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Invoices Registry Hub
            </h3>
            <button
              onClick={() => {
                reset({ amount: 0 });
                setValue('invoice_number', `INV-${Date.now().toString().slice(-4)}`);
                setInvoiceModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              Generate Invoice
            </button>
          </div>

          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Project Association</th>
                  <th className="p-4">Billed Amount</th>
                  <th className="p-4">Date Sent</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No invoices created.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.invoice_id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 text-white font-bold">{inv.invoice_number}</td>
                      <td className="p-4 text-slate-200">{inv.client_name}</td>
                      <td className="p-4 text-slate-400">{inv.project_name}</td>
                      <td className="p-4 text-brand-tech font-bold">{formatINR(inv.amount)}</td>
                      <td className="p-4 text-slate-400">{formatDateStr(inv.date_sent)}</td>
                      <td className="p-4 text-slate-400">{formatDateStr(inv.due_date)}</td>
                      <td className="p-4"><StatusBadge status={inv.status} /></td>
                      <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            reset(inv);
                            if (inv.date_sent) setValue('date_sent', inv.date_sent.split('T')[0]);
                            if (inv.due_date) setValue('due_date', inv.due_date.split('T')[0]);
                            setInvoiceModal({ open: true, editRecord: inv });
                          }}
                          className="p-1 text-slate-400 hover:text-brand-tech rounded transition-colors"
                          title="Edit invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.invoice_id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: PROPOSALS KANBAN
          ======================================================================= */}
      {activeTab === 'proposals' && (
        <div className="space-y-5">
          {/* Table mode vs Kanban mode selectors */}
          {proposalView === 'table' && (
            <div className="flex items-center justify-between print-hidden">
              <button
                onClick={() => setProposalView('kanban')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-card hover:bg-slate-800 text-slate-300 hover:text-white border border-brand-border/60 transition-all duration-200"
              >
                <KanbanSquare className="w-4.5 h-4.5 text-brand-tech" />
                Switch to Kanban board
              </button>

              <button
                onClick={() => {
                  reset({ proposal_value: 0 });
                  setProposalModal({ open: true, editRecord: null });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Proposal
              </button>
            </div>
          )}

          {/* Render visual Kanban cards */}
          <KanbanBoard
            columns={['Sent', 'Followed Up', 'Won', 'Lost']}
            cards={kanbanCards}
            onStatusChange={handleProposalStatusChange}
            onCardClick={(card) => {
              const rec = card.rawRecord;
              reset(rec);
              if (rec.date_sent) setValue('date_sent', rec.date_sent.split('T')[0]);
              if (rec.followup_date) setValue('followup_date', rec.followup_date.split('T')[0]);
              setProposalModal({ open: true, editRecord: rec });
            }}
            viewMode={proposalView}
            onViewModeToggle={() => setProposalView('table')}
            accentColor="brand-tech"
          />

          {/* Fallback Table view */}
          {proposalView === 'table' && (
            <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
              <table className="w-full text-left text-xs font-semibold text-slate-300">
                <thead>
                  <tr className="border-b border-brand-border/40 text-slate-400">
                    <th className="p-4">Lead Name</th>
                    <th className="p-4">Service Required</th>
                    <th className="p-4">Expected Value</th>
                    <th className="p-4">Date Sent</th>
                    <th className="p-4">Followup Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">WA</th>
                    <th className="p-4 text-right print-hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/20">
                  {proposals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                        No proposals generated.
                      </td>
                    </tr>
                  ) : (
                    proposals.map((prop) => (
                      <tr key={prop.proposal_id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 text-white font-bold">{prop.lead_name}</td>
                        <td className="p-4 text-slate-400">{prop.service_type}</td>
                        <td className="p-4 text-brand-tech font-bold">{formatINR(prop.proposal_value)}</td>
                        <td className="p-4 text-slate-400">{formatDateStr(prop.date_sent)}</td>
                        <td className="p-4 text-slate-400">{formatDateStr(prop.followup_date)}</td>
                        <td className="p-4"><StatusBadge status={prop.status} /></td>
                        <td className="p-4 text-center">
                          <WhatsAppButton mobile={prop.lead_mobile} />
                        </td>
                        <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              reset(prop);
                              if (prop.date_sent) setValue('date_sent', prop.date_sent.split('T')[0]);
                              if (prop.followup_date) setValue('followup_date', prop.followup_date.split('T')[0]);
                              setProposalModal({ open: true, editRecord: prop });
                            }}
                            className="p-1 text-slate-400 hover:text-brand-tech rounded transition-colors"
                            title="Edit proposal details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(prop.proposal_id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 5: REVENUE ANALYTICS
          ======================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly collection bar chart */}
            <div className="lg:col-span-2 rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Monthly revenue collections (12 Months Trend)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrend} margin={{ left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a/40" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip formatter={(value) => formatINR(Number(value))} />
                    <Bar dataKey="revenue" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Paid Collections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collected vs Pending pie breakdown */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Collected vs Outstanding Pending Balance
              </h4>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie
                      data={[
                        { name: 'Collected', value: analytics.totalCollected },
                        { name: 'Pending', value: analytics.totalPending }
                      ]}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(Number(value))} />
                  </RePie>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-around text-xs font-bold mt-2">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Collected ({((analytics.totalCollected / (analytics.totalCollected + analytics.totalPending || 1)) * 100).toFixed(0)}%)
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Pending ({((analytics.totalPending / (analytics.totalCollected + analytics.totalPending || 1)) * 100).toFixed(0)}%)
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top clients */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Top 5 Client accounts by Revenue (INR ₹)
              </h4>
              <div className="divide-y divide-brand-border/20">
                {analytics.topClients.map((client: any, i: number) => (
                  <div key={client.name} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400 font-extrabold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-slate-200">{client.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{formatMobileStr(client.mobile)}</p>
                      </div>
                    </div>
                    <span className="text-brand-tech font-bold">{formatINR(client.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service types split */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Pipeline Value split by Service Type
              </h4>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie
                      data={analytics.projectTypes}
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {analytics.projectTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RePie>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 6: EXPENSE TRACKER
          ======================================================================= */}
      {activeTab === 'expenses' && (
        <ExpensesTab businessSlug="tech" onSave={fetchData} />
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT PROJECT
          ======================================================================= */}
      {projectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {projectModal.editRecord ? 'Modify Project Fields' : 'Add New Project'}
            </h3>
            
            <form onSubmit={handleSubmit(handleProjectSubmit)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter project name"
                  {...register('project_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter client name"
                  {...register('client_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Client Mobile</label>
                <input
                  type="text"
                  placeholder="Mobile number"
                  {...register('client_mobile')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Service Type</label>
                <select
                  {...register('project_type')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                >
                  <option value="Website">Website</option>
                  <option value="Web App">Web App</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Automation">Automation</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Project Status</label>
                <select
                  {...register('status')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                >
                  <option value="Lead">Lead</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Deadline Date</label>
                <input
                  type="date"
                  {...register('deadline_date')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-tech"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Total Contract Value (₹)</label>
                <input
                  type="number"
                  placeholder="Total budget"
                  {...register('total_amount')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Amount Collected (₹)</label>
                <input
                  type="number"
                  placeholder="Advance/collections"
                  {...register('amount_received')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Project Notes</label>
                <textarea
                  placeholder="Scope or special details..."
                  {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setProjectModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT INVOICE
          ======================================================================= */}
      {invoiceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {invoiceModal.editRecord ? 'Modify Invoice Parameters' : 'Generate Invoice Record'}
            </h3>
            
            <form onSubmit={handleSubmit(handleInvoiceSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Invoice Number</label>
                <input
                  type="text"
                  required
                  {...register('invoice_number')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter client name"
                  {...register('client_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Project Association</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Web App Redesign"
                  {...register('project_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Due Amount (₹)</label>
                  <input
                    type="number"
                    required
                    {...register('amount')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Status</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Date Sent</label>
                  <input
                    type="date"
                    {...register('date_sent')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT PROPOSAL
          ======================================================================= */}
      {proposalModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {proposalModal.editRecord ? 'Modify Proposal Specifications' : 'Draft New Project Proposal'}
            </h3>
            
            <form onSubmit={handleSubmit(handleProposalSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Lead Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter lead/prospect name"
                  {...register('lead_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Lead Mobile</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    {...register('lead_mobile')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Service Type Required</label>
                  <select
                    {...register('service_type')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="Web App">Web App</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Automation">Automation</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Expected Value (₹)</label>
                  <input
                    type="number"
                    required
                    {...register('proposal_value')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Pipeline Stage</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Sent">Sent</option>
                    <option value="Followed Up">Followed Up</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Date Sent</label>
                  <input
                    type="date"
                    {...register('date_sent')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Followup Date</label>
                  <input
                    type="date"
                    {...register('followup_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Scope Summary / Proposal Notes</label>
                <textarea
                  placeholder="Scope parameters..."
                  {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setProposalModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-tech hover:bg-brand-tech/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default TechDashboard;
