import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, CalendarDays, User, DollarSign,
  FileText, BarChart2, Sparkles, Clock, Users, ShieldAlert,
  Percent, AlertTriangle, Printer, Check, Phone, Wallet, GraduationCap, ClipboardList, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatINR, formatDateStr, formatMobileStr } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { ExpensesTab } from '../../components/ui/ExpensesTab';
import { useSyncRefresh } from '../../hooks/useSyncRefresh';

// ==========================================
// INTERFACES
// ==========================================
interface Student {
  student_id: string;
  student_name: string;
  father_name: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  whatsapp_number: string | null;
  phone_number: string | null;
  parent_mobile: string | null;
  student_mobile: string | null;
  standard: string; // '1st' to '12th'
  section: string | null;
  school_name: string | null;
  medium: string | null;        // Tamil or English
  board: string | null;         // State Board, CBSE, ICSE, Matriculation
  department: 'General' | 'Science' | 'Commerce' | 'Arts' | null;
  subjects_enrolled: string | null;
  enrollment_date: string | null;
  monthly_fee: number;
  status: 'Active' | 'Inactive' | 'Completed';
  attendance_percentage?: number;
}


interface FeeRecord {
  fee_id: string;
  student_id: string;
  month_year: string;
  fee_amount: number;
  paid_date: string | null;
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | null;
  receipt_number: string | null;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface Staff {
  staff_id: string;
  staff_name: string;
  mobile: string;
  email: string | null;
  subject_specialization: string | null;
  standards_taught: string | null;
  joining_date: string | null;
  monthly_salary: number;
  status: 'Active' | 'Inactive';
}


export const CoachingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'fees' | 'staff' | 'analytics' | 'expenses' | 'attendance'>('dashboard');

  // Data States
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [growthRate, setGrowthRate] = useState<number | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  // Analytics Filter States
  const [analyticsDateType, setAnalyticsDateType] = useState<'lifetime' | 'month' | 'range'>('lifetime');
  const [analyticsMonthFilter, setAnalyticsMonthFilter] = useState('');
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fee Views
  const currentNow = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Generate rolling 24 months (-12 to +11)
  const generateRollingMonths = () => {
    const months = [];
    const d = new Date(currentNow.getFullYear(), currentNow.getMonth() - 12, 1);
    for (let i = 0; i < 24; i++) {
      months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  };
  const rollingMonths = generateRollingMonths();

  const [feeView, setFeeView] = useState<'history' | 'monthly' | 'overdue'>('monthly');
  const [selectedFeeMonth, setSelectedFeeMonth] = useState(`${monthNames[currentNow.getMonth()]} ${currentNow.getFullYear()}`);
  const [selectedStudentForFees, setSelectedStudentForFees] = useState<Student | null>(null);
  const [studentFeeHistory, setStudentFeeHistory] = useState<FeeRecord[]>([]);
  const [monthlyFeeCollection, setMonthlyFeeCollection] = useState<any[]>([]);
  const [overdueFeesList, setOverdueFeesList] = useState<any[]>([]);

  // Student form parent toggle
  const [hasParent, setHasParent] = useState(true);

  // Modals state
  const [studentModal, setStudentModal] = useState<{ open: boolean; editRecord: Student | null }>({ open: false, editRecord: null });
  const [staffModal, setStaffModal] = useState<{ open: boolean; editRecord: Staff | null }>({ open: false, editRecord: null });

  const [feeRecordModal, setFeeRecordModal] = useState<{ open: boolean; record: any | null }>({ open: false, record: null });

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchStudents = async () => {
    if (students.length > 0) return; // cache locally
    try {
      const res = await apiClient.get('/coaching/students');
      if (res.data.success) setStudents(res.data.data);
    } catch (e) {
      toast.error('Failed to load students.');
    }
  };

  const fetchStaff = async () => {
    if (staff.length > 0) return;
    try {
      const res = await apiClient.get('/coaching/staff');
      if (res.data.success) setStaff(res.data.data);
    } catch (e) {
      toast.error('Failed to load staff.');
    }
  };

  const fetchOverdueBackground = async () => {
    try {
      const res = await apiClient.get('/coaching/fees/overdue');
      if (res.data.success) {
        setOverdueFeesList(res.data.data);
        const overdueAlerts = res.data.data.map((item: any) => ({
          id: `coaching-overdue-${item.student_id}`,
          title: `Overdue Tuition Fees Alert!`,
          message: `${item.student_name} (${item.standard}) is ${item.unpaid_months_count} months overdue. Total: ${formatINR(item.total_amount_due)}`,
          type: 'error',
          section: 'AchieversNest'
        }));
        useAuthStore.getState().setNotifications(overdueAlerts);
      }
    } catch (e) {
      console.error('Background fetch overdue failed');
    }
  };

  // Initial Boot
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchDashboardSummary(), fetchStudents(), fetchAnalytics()]).finally(() => {
      if (isMounted) setLoading(false);
    });
    fetchOverdueBackground();
    return () => { isMounted = false; };
  }, []);

  const refreshAll = useCallback(() => fetchData(), []);
  useSyncRefresh(refreshAll);

  // Lazy load by tab — 'dashboard' is excluded because the boot effect always fetches it
  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'attendance') fetchStudents();
    if (activeTab === 'attendance') fetchAttendance(attendanceDate);
    else if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, analyticsDateType, analyticsMonthFilter, analyticsStartDate, analyticsEndDate]);

  const fetchDashboardSummary = async () => {
    try {
      const res = await apiClient.get('/coaching/dashboard-summary');
      if (res.data.success) {
        setDashboardSummary(res.data.dashboard);
      }
    } catch (e) {
      console.error('Failed to load dashboard summary');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params: any = {};
      if (analyticsDateType === 'month' && analyticsMonthFilter) params.month = analyticsMonthFilter;
      if (analyticsDateType === 'range' && analyticsStartDate && analyticsEndDate) {
        params.startDate = analyticsStartDate;
        params.endDate = analyticsEndDate;
      }
      const res = await apiClient.get('/coaching/analytics', { params });
      if (res.data.success) {
        const data = res.data.analytics;
        setAnalytics(data);
        
        // Compute Month-over-Month growth rate from monthlyTrend array
        if (data.monthlyTrend && data.monthlyTrend.length >= 2) {
          const currentMonth = data.monthlyTrend[data.monthlyTrend.length - 1];
          const previousMonth = data.monthlyTrend[data.monthlyTrend.length - 2];
          if (previousMonth.collected > 0) {
            const growth = ((currentMonth.collected - previousMonth.collected) / previousMonth.collected) * 100;
            setGrowthRate(Number(growth.toFixed(1)));
          } else {
            setGrowthRate(null);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load analytics.');
    }
  };

  const fetchData = async () => {
    try {
      const [stuRes, stfRes] = await Promise.all([
        apiClient.get('/coaching/students'),
        apiClient.get('/coaching/staff')
      ]);
      if (stuRes.data.success) setStudents(stuRes.data.data);
      if (stfRes.data.success) setStaff(stfRes.data.data);
      fetchDashboardSummary();
      fetchAnalytics();
      fetchOverdueBackground();
    } catch (e) {
      console.error('Failed to refresh data', e);
    }
  };

  const fetchAttendance = async (date: string) => {
    try {
      const res = await apiClient.get(`/coaching/attendance?date=${date}`);
      if (res.data.success) setAttendanceRecords(res.data.data);
    } catch (e) {
      toast.error('Failed to load attendance');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const res = await apiClient.post('/coaching/attendance', {
        date: attendanceDate,
        records: attendanceRecords
      });
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (e) {
      toast.error('Failed to save attendance');
    }
  };

  // Fetch monthly fee records when selected month changes
  useEffect(() => {
    const fetchMonthlyFees = async () => {
      try {
        const res = await apiClient.get(`/coaching/fees/monthly?monthYear=${selectedFeeMonth}`);
        if (res.data.success) {
          setMonthlyFeeCollection(res.data.data);
        }
      } catch (e) {
        console.error('Failed to load monthly collection');
      }
    };
    if (activeTab === 'fees' && feeView === 'monthly') {
      fetchMonthlyFees();
    }
  }, [selectedFeeMonth, activeTab, feeView]);

  // Fetch fee history for specific student
  const handleLoadStudentFeeHistory = async (student: Student) => {
    setSelectedStudentForFees(student);
    setFeeView('history');
    try {
      const res = await apiClient.get(`/coaching/fees/student/${student.student_id}`);
      if (res.data.success) {
        setStudentFeeHistory(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load student fee history.');
    }
  };

  // --- SAVE FORM SUBMITS ---
  const handleStudentSubmit = async (data: any) => {
    if (isSaving) { toast.error('Save already in progress, please wait.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        monthly_fee: Number(data.monthly_fee || 0)
      };

      let res;
      if (studentModal.editRecord) {
        res = await apiClient.put(`/coaching/students/${studentModal.editRecord.student_id}`, payload);
      } else {
        res = await apiClient.post('/coaching/students', payload);
      }
      if (res.data.success) {
        toast.success('Student record saved.');
        setStudentModal({ open: false, editRecord: null });
        fetchData(); // run in background
      }
    } catch (e) {
      toast.error('Failed to save student.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStaffSubmit = async (data: any) => {
    if (isSaving) { toast.error('Save already in progress, please wait.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        monthly_salary: Number(data.monthly_salary || 0)
      };

      let res;
      if (staffModal.editRecord) {
        res = await apiClient.put(`/coaching/staff/${staffModal.editRecord.staff_id}`, payload);
      } else {
        res = await apiClient.post('/coaching/staff', payload);
      }
      if (res.data.success) {
        toast.success('Staff record saved.');
        setStaffModal({ open: false, editRecord: null });
        fetchData(); // run in background
      }
    } catch (e) {
      toast.error('Failed to save staff record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Inline Fee payment collector
  const handleCollectFeeSubmit = async (data: any) => {
    if (isSaving) { toast.error('Save already in progress, please wait.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...feeRecordModal.record,
        fee_amount: feeRecordModal.record.monthly_fee || feeRecordModal.record.fee_amount,
        month_year: feeRecordModal.record.month_year || selectedFeeMonth,
        payment_mode: data.payment_mode,
        receipt_number: data.receipt_number || `REC-${Date.now().toString().slice(-6)}`,
        paid_date: data.paid_date || new Date().toISOString().split('T')[0],
        status: 'Paid',
        notes: data.notes
      };
      const res = await apiClient.post('/coaching/fees', payload);

      if (res.data.success) {
        toast.success('Tuition fee collected!');
        setFeeRecordModal({ open: false, record: null });
        
        // Refresh appropriate view
        if (selectedStudentForFees) {
          handleLoadStudentFeeHistory(selectedStudentForFees);
        } else {
          // Refresh monthly collection
          const refreshRes = await apiClient.get(`/coaching/fees/monthly?monthYear=${selectedFeeMonth}`);
          if (refreshRes.data.success) setMonthlyFeeCollection(refreshRes.data.data);
        }
        fetchData(); // run in background
      }
    } catch (e) {
      toast.error('Fee collection failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoGenerateFees = async () => {
    if (!window.confirm(`Are you sure you want to auto-generate pending fee records for all active students for ${selectedFeeMonth}?`)) return;
    try {
      const res = await apiClient.post('/coaching/fees/auto-generate', { monthYear: selectedFeeMonth });
      if (res.data.success) {
        toast.success(res.data.message);
        
        // Refresh monthly collection
        const refreshRes = await apiClient.get(`/coaching/fees/monthly?monthYear=${selectedFeeMonth}`);
        if (refreshRes.data.success) setMonthlyFeeCollection(refreshRes.data.data);
        
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to auto-generate fees');
    }
  };

  // --- EXPORT DATA ---
  const handleExportMonthlyCSV = () => {
    if (monthlyFeeCollection.length === 0) return toast.error('No data to export.');
    const exportData = monthlyFeeCollection.map(r => ({
      'Student Name': r.student_name,
      'Standard': r.standard,
      'Fee Amount': r.monthly_fee,
      'Status': r.status,
      'Paid Date': r.paid_date ? String(r.paid_date).split('T')[0] : 'N/A',
      'Receipt No': r.receipt_number || 'N/A',
      'Contact': r.parent_mobile || 'N/A'
    }));
    exportToCSV(exportData, `Tuition_Collection_${selectedFeeMonth.replace(' ', '_')}`);
  };

  const handleExportMonthlyPDF = () => {
    if (monthlyFeeCollection.length === 0) return toast.error('No data to export.');
    const headers = ['Student Name', 'Std', 'Amount', 'Status', 'Paid Date', 'Receipt'];
    const rows = monthlyFeeCollection.map(r => [
      r.student_name,
      r.standard,
      formatINR(r.monthly_fee),
      r.status,
      r.paid_date ? formatDateStr(r.paid_date) : '-',
      r.receipt_number || '-'
    ]);
    exportToPDF(
      `Monthly Tuition Collection: ${selectedFeeMonth}`,
      headers,
      rows,
      `Tuition_Collection_${selectedFeeMonth.replace(' ', '_')}`,
      [247, 183, 49] // Brand Coaching color (Yellow)
    );
  };

  // --- DELETE CONTROLS ---
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Delete this coaching student?')) return;
    try {
      await apiClient.delete(`/coaching/students/${id}`);
      toast.success('Student record deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Delete this staff record?')) return;
    try {
      await apiClient.delete(`/coaching/staff/${id}`);
      toast.success('Staff profile deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.father_name && s.father_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStandard = standardFilter ? s.standard === standardFilter : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;

    return matchesSearch && matchesStandard && matchesStatus;
  });

  // --- PRINT WINDOW TRIGGER CONTROLLERS ---
  const handlePrintReportCard = () => {
    window.print();
  };

  const handlePrintReceipt = (feeRecord: any) => {
    // Determine student info from either the selected student (history view) or the fee record itself (monthly grid)
    const studentName = selectedStudentForFees?.student_name || feeRecord.student_name;
    const studentId = selectedStudentForFees?.student_id || feeRecord.student_id;
    const standard = selectedStudentForFees?.standard || feeRecord.standard;

    if (!studentName || !studentId) {
      toast.error('Cannot print receipt: Student details missing.');
      return;
    }
    
    generateFeeReceipt({
      businessName: 'AchieversNest',
      businessAddress: '123 Tech Park, Chennai, Tamil Nadu',
      receiptNumber: feeRecord.receipt_number || `REC-${feeRecord.fee_id.substring(0, 8).toUpperCase()}`,
      date: feeRecord.paid_date || new Date().toISOString(),
      studentName: studentName,
      studentId: studentId,
      courseOrStandard: standard || 'N/A',
      paymentMode: feeRecord.payment_mode || 'Cash',
      amount: feeRecord.fee_amount,
      status: feeRecord.status
    });
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-8 h-8 border-4 border-brand-coaching border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold tracking-wider">Syncing Coaching Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      
      {/* Sub tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-brand-border/40 print-hidden">
        {[
          { key: 'dashboard', label: 'Dashboard Summary', icon: BarChart2 },
          { key: 'students', label: 'Coaching Students Register', icon: Users },
          { key: 'fees', label: 'Tuition Fee Management', icon: Wallet },
          { key: 'attendance', label: 'Attendance Register', icon: ClipboardList },
{ key: 'staff', label: 'Teachers Registry', icon: User },
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
                  ? 'bg-brand-coaching/10 text-brand-coaching border border-brand-coaching/30 shadow-[0_0_10px_rgba(247,183,49,0.1)]'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =======================================================================
          TAB 0: DASHBOARD SUMMARY
          ======================================================================= */}
      {activeTab === 'dashboard' && dashboardSummary && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-white mt-1">{dashboardSummary.keyMetrics.totalStudents}</h3>
              <p className="text-emerald-400 text-xs font-semibold mt-1">{dashboardSummary.keyMetrics.activeStudents} Active</p>
            </div>
            <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Billed to Date</p>
              <h3 className="text-2xl font-black text-white mt-1">{formatINR(dashboardSummary.keyMetrics.billedToDate)}</h3>
              <p className="text-slate-500 text-[10px] font-semibold mt-1">Expected: {formatINR(dashboardSummary.keyMetrics.monthlyFeeExpected)} / month</p>
            </div>
            <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Collected</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatINR(dashboardSummary.keyMetrics.totalCollected)}</h3>
              <p className="text-emerald-500/80 text-[10px] font-semibold mt-1">{dashboardSummary.keyMetrics.collectionPercentage}% Collection Rate</p>
            </div>
            <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Outstanding</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{formatINR(dashboardSummary.keyMetrics.totalOutstanding)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Standard Table */}
            <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">By Standard</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-[10px] uppercase text-slate-500 tracking-wider">
                      <th className="p-2 font-bold">Standard</th>
                      <th className="p-2 font-bold text-center">Students</th>
                      <th className="p-2 font-bold text-right">Billed (₹)</th>
                      <th className="p-2 font-bold text-right text-emerald-500">Collected (₹)</th>
                      <th className="p-2 font-bold text-right text-rose-500">Due (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {dashboardSummary.byStandard.filter((s: any) => s.students > 0 || s.billed > 0).map((row: any) => (
                      <tr key={row.standard} className="hover:bg-slate-800/10">
                        <td className="p-2 text-white font-bold">{row.standard}</td>
                        <td className="p-2 text-slate-300 text-center">{row.students}</td>
                        <td className="p-2 text-slate-300 text-right">{row.billed.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-emerald-400 text-right font-semibold">{row.collected.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-rose-400 text-right font-semibold">{row.due.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              {/* By Medium Table */}
              <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">By Medium</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-brand-border/40 text-[10px] uppercase text-slate-500 tracking-wider">
                        <th className="p-2 font-bold">Medium</th>
                        <th className="p-2 font-bold text-center">Students</th>
                        <th className="p-2 font-bold text-right text-emerald-500">Collected (₹)</th>
                        <th className="p-2 font-bold text-right text-rose-500">Due (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20">
                      {dashboardSummary.byMedium.map((row: any) => (
                        <tr key={row.medium} className="hover:bg-slate-800/10">
                          <td className="p-2 text-white font-bold">{row.medium}</td>
                          <td className="p-2 text-slate-300 text-center">{row.students}</td>
                          <td className="p-2 text-emerald-400 text-right font-semibold">{row.collected.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-rose-400 text-right font-semibold">{row.due.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Staff & Salary summary */}
              <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">Staff & Salary Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Total Staff</p>
                    <p className="text-white text-sm font-black mt-0.5">{dashboardSummary.staffSalary.totalStaff}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Monthly Salary</p>
                    <p className="text-white text-sm font-black mt-0.5">{formatINR(dashboardSummary.staffSalary.monthlySalaryFull)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Monthly Salary Bill</p>
                    <p className="text-rose-400 text-sm font-black mt-0.5">{formatINR(dashboardSummary.staffSalary.monthlySalaryFull)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Gross Revenue</p>
                    <p className="text-emerald-400 text-sm font-black mt-0.5">{formatINR(dashboardSummary.keyMetrics.totalCollected)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 1: STUDENTS REGISTER
          ======================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student or parent..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Standards</option>
                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(st => (
                  <option key={st} value={st}>{st} Standard</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => {
                reset({ student_name: '', father_name: '', father_occupation: '', mother_name: '', mother_occupation: '', whatsapp_number: '', phone_number: '', parent_mobile: '', student_mobile: '', standard: '', section: '', school_name: '', medium: '', board: '', department: '', subjects_enrolled: '', monthly_fee: 3000, status: 'Active', notes: '', enrollment_date: new Date().toISOString().split('T')[0] });
                setHasParent(true);
                setStudentModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              Register Student
            </button>
          </div>

          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Student</th>
                  <th className="p-4">Parent / Occupation</th>
                  <th className="p-4">Standard</th>
                  <th className="p-4">School</th>
                  <th className="p-4">Medium / Board</th>
                  <th className="p-4">Monthly Fee</th>
                  <th className="p-4">Fee Due</th>
                  <th className="p-4">Enroll Date</th>
                  <th className="p-4">Status & Attendance</th>
                  <th className="p-4 text-center">WhatsApp</th>
                  <th className="p-4 text-right print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const overdueItem = overdueFeesList.find(o => o.student_id === s.student_id);
                    const whatsappContact = s.whatsapp_number || s.phone_number || s.parent_mobile;
                    return (
                    <tr key={s.student_id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <p className="text-white font-bold">{s.student_name}</p>
                        {s.student_mobile && <p className="text-[10px] text-slate-500 mt-0.5">{formatMobileStr(s.student_mobile)}</p>}
                      </td>
                      <td className="p-4">
                        {s.father_name && (
                          <p className="text-slate-300 font-semibold">
                            {s.father_name}
                            {s.father_occupation && <span className="text-slate-500 font-normal"> · {s.father_occupation}</span>}
                          </p>
                        )}
                        {s.mother_name && (
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {s.mother_name}
                            {s.mother_occupation && <span> · {s.mother_occupation}</span>}
                          </p>
                        )}
                        {!s.father_name && !s.mother_name && <span className="text-slate-600">-</span>}
                      </td>
                      <td className="p-4 text-brand-coaching font-bold">{s.standard}{s.section ? ` - ${s.section}` : ''}</td>
                      <td className="p-4 text-slate-400 max-w-[120px] truncate" title={s.school_name || ''}>{s.school_name || '-'}</td>
                      <td className="p-4">
                        {s.medium && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black border mb-1 ${
                            s.medium === 'Tamil' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' : 'bg-blue-950/20 text-blue-400 border-blue-900/30'
                          }`}>
                            {s.medium}
                          </span>
                        )}
                        {s.board && <p className="text-[10px] text-slate-500 mt-0.5">{s.board}</p>}
                        {!s.medium && !s.board && <span className="text-slate-600">-</span>}
                      </td>
                      <td className="p-4 text-white font-bold">{formatINR(s.monthly_fee)}</td>
                      <td className="p-4">
                        {overdueItem ? (
                          <div>
                            <span className="text-rose-400 font-black">{formatINR(overdueItem.total_amount_due)}</span>
                            <p className="text-[9px] text-rose-500 mt-0.5">{overdueItem.unpaid_months_count} month{overdueItem.unpaid_months_count > 1 ? 's' : ''} due</p>
                          </div>
                        ) : (
                          <span className="text-emerald-500 font-bold text-[10px]">✓ Clear</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400">{formatDateStr(s.enrollment_date)}</td>
                      <td className="p-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="p-4 text-center">
                        <WhatsAppButton mobile={whatsappContact || ''} />
                      </td>
                      <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                        <div className="relative inline-block group mr-1.5 text-left">
                          <button
                            className="p-1 text-slate-400 hover:text-green-400 rounded hover:bg-slate-800 focus:outline-none"
                            title="Call..."
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          </button>
                          <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-36 bg-slate-800 border border-brand-border/60 rounded-lg shadow-lg z-50 overflow-hidden">
                            <div className="py-1">
                              {s.father_name && s.parent_mobile ? (
                                <a href={`tel:${s.parent_mobile}`} className="block px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white">
                                  Call Father
                                </a>
                              ) : null}
                              {s.mother_name && s.phone_number ? (
                                <a href={`tel:${s.phone_number}`} className="block px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white">
                                  Call Mother
                                </a>
                              ) : null}
                              {s.student_mobile ? (
                                <a href={`tel:${s.student_mobile}`} className="block px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white">
                                  Call Student
                                </a>
                              ) : null}
                              {!(s.parent_mobile || s.phone_number || s.student_mobile) && (
                                <span className="block px-3 py-1.5 text-[10px] font-bold text-slate-500">No Numbers</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLoadStudentFeeHistory(s)}
                          className="p-1 text-slate-400 hover:text-brand-coaching rounded hover:bg-slate-800"
                          title="View tuition payments"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            reset(s);
                            if (s.enrollment_date) setValue('enrollment_date', s.enrollment_date.split('T')[0]);
                            setHasParent(!!(s.father_name || s.mother_name));
                            setStudentModal({ open: true, editRecord: s });
                          }}
                          className="p-1 text-slate-400 hover:text-brand-coaching rounded hover:bg-slate-800"
                          title="Edit profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.student_id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/20"
                          title="Delete student"
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
          TAB 2: TUITION FEE MANAGEMENT
          ======================================================================= */}
      {activeTab === 'fees' && (
        <div className="space-y-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-brand-border/20 print-hidden">
            {[
              { key: 'monthly', label: 'Monthly Grid' },
              { key: 'overdue', label: 'Pending Payments' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setFeeView(tab.key as any);
                  setSelectedStudentForFees(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  feeView === tab.key && !selectedStudentForFees
                    ? 'bg-brand-coaching/15 text-brand-coaching border border-brand-coaching/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* VIEW A: MONTHLY COLLECTION GRID */}
          {feeView === 'monthly' && !selectedStudentForFees && (
            <div className="space-y-4">
              <div className="flex items-center justify-between print-hidden">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Selected calendar month:</span>
                  <select
                    value={selectedFeeMonth}
                    onChange={(e) => setSelectedFeeMonth(e.target.value)}
                    className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
                  >
                    {rollingMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMonthlyCSV}
                    title="Export to CSV"
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-brand-border/60 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExportMonthlyPDF}
                    title="Export to PDF"
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-brand-border/60 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleAutoGenerateFees}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-brand-border/60 rounded-xl text-xs font-black uppercase text-slate-200 transition-all ml-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Auto-Generate Month Fees
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
                <table className="w-full text-left text-xs font-semibold text-slate-300">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-slate-400">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Standard</th>
                      <th className="p-4">Monthly Fee</th>
                      <th className="p-4">Paid Date</th>
                      <th className="p-4">Receipt Number</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4 text-center">WA Parent</th>
                      <th className="p-4 text-right print-hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {monthlyFeeCollection.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p>No fee records found for this month.</p>
                            <p className="text-[10px]">Click "Auto-Generate Pending Fees" to instantiate fee records for active students.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      monthlyFeeCollection.map(record => (
                        <tr key={record.student_id} className="hover:bg-slate-800/10">
                          <td className="p-4 text-white font-bold">{record.student_name}</td>
                          <td className="p-4 text-brand-coaching">{record.standard}</td>
                          <td className="p-4 text-white font-bold">{formatINR(record.monthly_fee)}</td>
                          <td className="p-4 text-slate-400">{formatDateStr(record.paid_date)}</td>
                          <td className="p-4 text-slate-400">{record.receipt_number || '-'}</td>
                          <td className="p-4"><StatusBadge status={record.status} /></td>
                          <td className="p-4 text-center">
                            <WhatsAppButton 
                              mobile={record.parent_mobile} 
                              message={record.status !== 'Paid' ? `Dear Parent, the tuition fee for ${record.student_name} for ${selectedFeeMonth} is pending. Amount: ${formatINR(record.monthly_fee)}. Please pay at the earliest. - AchieversNest` : undefined}
                            />
                          </td>
                          <td className="p-4 text-right print-hidden">
                            {record.status !== 'Paid' ? (
                              <button
                                onClick={() => { reset({ payment_mode: 'Cash', receipt_number: '', paid_date: new Date().toISOString().split('T')[0], notes: '' }); setFeeRecordModal({ open: true, record }); }}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-brand-coaching hover:bg-brand-coaching/85 text-white shadow"
                              >
                                Collect Fee
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePrintReceipt(record)}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                                title="Print fee receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW B: OVERDUE CHECKS */}
          {feeView === 'overdue' && !selectedStudentForFees && (
            <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
              <table className="w-full text-left text-xs font-semibold text-slate-300">
                <thead>
                  <tr className="border-b border-brand-border/40 text-slate-400">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Standard</th>
                    <th className="p-4">Monthly Fee</th>
                    <th className="p-4">Overdue Months Count</th>
                    <th className="p-4">Overdue Calendar Months</th>
                    <th className="p-4">Total Pending Amount Due</th>
                    <th className="p-4 text-center">WA Parent</th>
                    <th className="p-4 text-right print-hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/20">
                  {overdueFeesList.map((item) => (
                    <tr key={item.student_id} className="hover:bg-slate-800/10">
                      <td className="p-4 text-white font-bold">{item.student_name}</td>
                      <td className="p-4 text-brand-coaching">{item.standard}</td>
                      <td className="p-4 text-white font-bold">{formatINR(item.monthly_fee)}</td>
                      <td className="p-4 text-rose-400 font-extrabold">{item.unpaid_months_count} Months overdue</td>
                      <td className="p-4 text-slate-400">{item.unpaid_months.join(', ')}</td>
                      <td className="p-4 text-rose-400 font-black">{formatINR(item.total_amount_due)}</td>
                      <td className="p-4 text-center">
                        <WhatsAppButton 
                          mobile={item.parent_mobile} 
                          message={`Dear Parent, the tuition fee for ${item.student_name} is pending for ${item.unpaid_months_count} month(s) (${item.unpaid_months.join(', ')}). Total amount due: ${formatINR(item.total_amount_due)}. Please pay at the earliest. - AchieversNest`}
                        />
                      </td>
                      <td className="p-4 text-right print-hidden">
                        <button
                          onClick={() => {
                            // Find student record and load their fee history grid
                            const std = students.find(s => s.student_id === item.student_id);
                            if (std) handleLoadStudentFeeHistory(std);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 border border-brand-border"
                        >
                          View Fee Matrix
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW C: SPECIFIC STUDENT FEE MATRIX HISTORY */}
          {selectedStudentForFees && (
            <div className="space-y-4">
              <div className="flex items-center justify-between print-hidden">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Tuition Fees Matrix for: <span className="text-brand-coaching">{selectedStudentForFees.student_name}</span> ({selectedStudentForFees.standard})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Click "Collect Fee" to enter transaction receipts for any month.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentForFees(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-brand-border/60"
                >
                  Back to Collection
                </button>
              </div>

              <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
                <table className="w-full text-left text-xs font-semibold text-slate-300">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-slate-400">
                      <th className="p-4">Calendar Month</th>
                      <th className="p-4">Monthly Fee</th>
                      <th className="p-4">Paid Date</th>
                      <th className="p-4">Payment Mode</th>
                      <th className="p-4">Receipt Number</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right print-hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {studentFeeHistory.map((fee) => (
                      <tr key={fee.fee_id} className="hover:bg-slate-800/10">
                        <td className="p-4 text-white font-bold">{fee.month_year}</td>
                        <td className="p-4 text-slate-300 font-bold">{formatINR(fee.fee_amount)}</td>
                        <td className="p-4 text-slate-400">{formatDateStr(fee.paid_date)}</td>
                        <td className="p-4 text-slate-400">{fee.payment_mode || '-'}</td>
                        <td className="p-4 text-slate-400">{fee.receipt_number || '-'}</td>
                        <td className="p-4"><StatusBadge status={fee.status} /></td>
                        <td className="p-4 text-right print-hidden">
                          {fee.status !== 'Paid' ? (
                            <button
                              onClick={() => { reset({ payment_mode: 'Cash', receipt_number: '', paid_date: new Date().toISOString().split('T')[0], notes: '' }); setFeeRecordModal({ open: true, record: { ...fee, student_name: selectedStudentForFees.student_name, monthly_fee: fee.fee_amount } }); }}
                              className="px-2.5 py-1 rounded bg-brand-coaching hover:bg-brand-coaching/80 text-white font-black"
                            >
                              Collect Fee
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrintReceipt(fee)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =======================================================================
          TAB 4: ATTENDANCE REGISTER
          ======================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Daily Attendance Register
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  fetchAttendance(e.target.value);
                }}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200"
              />
              <button
                onClick={handleSaveAttendance}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
              >
                <Check className="w-4 h-4" />
                Save Attendance
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Standard</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active students found for attendance.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record, index) => (
                    <tr key={record.student_id} className="hover:bg-slate-800/10">
                      <td className="p-4 text-white font-bold">{record.student_name}</td>
                      <td className="p-4 text-brand-coaching">{record.standard}</td>
                      <td className="p-4">
                        <select 
                          value={record.status}
                          onChange={(e) => {
                            const updated = [...attendanceRecords];
                            updated[index].status = e.target.value;
                            setAttendanceRecords(updated);
                          }}
                          className="bg-slate-950 p-1 rounded border border-brand-border text-slate-300 focus:outline-none"
                        >
                          <option value="Not Marked">Not Marked</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          placeholder="Optional note..." 
                          className="bg-transparent border-b border-brand-border/50 text-slate-400 w-full focus:outline-none focus:border-brand-coaching text-[11px]"
                          value={record.notes || ''}
                          onChange={(e) => {
                             const updated = [...attendanceRecords];
                             updated[index].notes = e.target.value;
                             setAttendanceRecords(updated);
                          }}
                        />
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
          TAB 5: STAFF MANAGEMENT
          ======================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Teachers & Staff Directory
            </h3>
            <button
              onClick={() => {
                reset({ staff_name: '', mobile: '', email: '', subject_specialization: '', standards_taught: '', monthly_salary: 20000, status: 'Active', notes: '', joining_date: '' });
                setStaffModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Teacher Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {staff.map((member) => (
              <div key={member.staff_id} className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4 hover:border-brand-coaching/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-heading">{member.staff_name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{member.subject_specialization || 'General Teacher'}</p>
                  </div>
                  <WhatsAppButton mobile={member.mobile} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold bg-brand-dark/40 border border-brand-border/20 rounded-xl p-3">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase">Monthly Salary</p>
                    <p className="text-brand-coaching mt-0.5">{formatINR(member.monthly_salary)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase">Standards taught</p>
                    <p className="text-slate-300 mt-0.5 max-w-[100px] truncate" title={member.standards_taught || ''}>{member.standards_taught || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-border/20 text-[10px] font-bold text-slate-500">
                  <span>Joined: {formatDateStr(member.joining_date)}</span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        reset(member);
                        if (member.joining_date) setValue('joining_date', member.joining_date.split('T')[0]);
                        setStaffModal({ open: true, editRecord: member });
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-brand-coaching"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.staff_id)}
                      className="p-1 rounded hover:bg-rose-950/20 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 7: REVENUE ANALYTICS
          ======================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Analytics Filters */}
          <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <select
                value={analyticsDateType}
                onChange={(e) => setAnalyticsDateType(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="lifetime">Lifetime</option>
                <option value="month">Specific Month</option>
                <option value="range">Custom Range</option>
              </select>
            </div>

            {analyticsDateType === 'month' && (
              <input
                type="month"
                value={analyticsMonthFilter}
                onChange={(e) => setAnalyticsMonthFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            )}

            {analyticsDateType === 'range' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 text-xs font-bold">TO</span>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly collection bar chart */}
            <div className="lg:col-span-2 rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Monthly tuition collection trend (Last 12 Months)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrend} margin={{ left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a/40" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip formatter={(value) => formatINR(Number(value))} />
                    <Bar dataKey="collected" fill="#f7b731" radius={[4, 4, 0, 0]} name="Fees Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Salary vs Fee collected (Profit indicator) */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Operational Budget Profit Indicator
              </h4>
              
              <div className="space-y-4 text-xs font-semibold flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                  <span className="text-slate-400">Total Fees Collected:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{formatINR(analytics.overallFeesCollected)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-brand-border/20">
                  <span className="text-slate-400">Teacher Payout Salaries:</span>
                  <span className="text-rose-400 font-extrabold text-sm">{formatINR(analytics.staffSalaryTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-slate-200">Net Profit Margin:</span>
                  <span className={`font-black text-base ${
                    (analytics.overallFeesCollected - analytics.staffSalaryTotal) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formatINR(analytics.overallFeesCollected - analytics.staffSalaryTotal)}
                  </span>
                </div>

                {growthRate !== null && (
                  <div className="flex justify-between items-center py-2.5 mt-2 border-t border-brand-border/40 bg-slate-900/40 px-3 rounded-xl">
                    <span className="text-slate-400">MoM Growth Rate:</span>
                    <span className={`font-black text-xs px-2 py-1 rounded ${
                      growthRate > 0 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 
                      growthRate < 0 ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50' : 
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {growthRate > 0 ? '+' : ''}{growthRate}%
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Standard wise revenue */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Standard-Wise tuition fee collections (INR ₹)
              </h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.standardBreakdown} margin={{ left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a/40" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip formatter={(value) => formatINR(Number(value))} />
                    <Bar dataKey="value" fill="#f7b731" radius={[4, 4, 0, 0]} name="Revenue Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overdue dues summary card details */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading">
                Outstanding Overdue Tuition Fee Balances
              </h4>
              
              <div className="divide-y divide-brand-border/20 max-h-56 overflow-y-auto">
                {overdueFeesList.map((item) => (
                  <div key={item.student_id} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <p className="text-slate-200 font-bold">{item.student_name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{item.standard} Standard | {item.unpaid_months_count} months due</p>
                    </div>
                    <span className="text-rose-400 font-black">{formatINR(item.total_amount_due)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 8: EXPENSE TRACKER
          ======================================================================= */}
      {activeTab === 'expenses' && (
        <ExpensesTab businessSlug="coaching" onSave={fetchData} />
      )}

      {/* =======================================================================
          MODAL: REGISTER STUDENT
          ======================================================================= */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-2xl bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-white font-heading">
              {studentModal.editRecord ? 'Modify Student Profile' : 'Register Coaching Student'}
            </h3>

            <form onSubmit={handleSubmit(handleStudentSubmit)} className="space-y-5 text-xs font-semibold">

              {/* Student Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  {...register('student_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching"
                />
              </div>

              {/* Parent / Guardian Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasParent}
                    onChange={(e) => {
                      setHasParent(e.target.checked);
                      if (!e.target.checked) {
                        setValue('father_name', '');
                        setValue('father_occupation', '');
                        setValue('mother_name', '');
                        setValue('mother_occupation', '');
                        setValue('parent_mobile', '');
                      }
                    }}
                    className="w-4 h-4 accent-brand-coaching"
                  />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Has Parent / Guardian</span>
                </label>
                {!hasParent && (
                  <span className="text-[10px] text-amber-400 font-semibold">(Parent fields hidden)</span>
                )}
              </div>

              {/* Parent Details */}
              {hasParent && (
                <div>
                  <p className="text-[10px] text-brand-coaching uppercase tracking-widest font-black mb-3">Parent / Guardian Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider">Father Name</label>
                      <input type="text" {...register('father_name')} placeholder="Father's full name"
                        className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider">Father's Occupation</label>
                      <input type="text" {...register('father_occupation')} placeholder="e.g. Builder, Teacher"
                        className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider">Mother Name</label>
                      <input type="text" {...register('mother_name')} placeholder="Mother's full name"
                        className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider">Mother's Occupation</label>
                      <input type="text" {...register('mother_occupation')} placeholder="e.g. House Wife, Tailor"
                        className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider">Parent Mobile (Primary Contact)</label>
                      <input type="tel" {...register('parent_mobile')} placeholder="Parent's call/WhatsApp number"
                        className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Numbers */}
              <div>
                <p className="text-[10px] text-brand-coaching uppercase tracking-widest font-black mb-3">Contact Numbers</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                    <input type="tel" {...register('whatsapp_number')} placeholder="e.g. 9876543210"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Phone Number (Alternate)</label>
                    <input type="tel" {...register('phone_number')} placeholder="e.g. 9876543210"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Student Mobile</label>
                    <input type="tel" {...register('student_mobile')} placeholder="Student's own number"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <p className="text-[10px] text-brand-coaching uppercase tracking-widest font-black mb-3">Academic Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">School Name</label>
                    <input type="text" {...register('school_name')} placeholder="e.g. CMS Vadavalli"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Medium</label>
                    <select {...register('medium')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching">
                      <option value="">Select medium</option>
                      <option value="Tamil">Tamil</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Board</label>
                    <select {...register('board')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching">
                      <option value="">Select board</option>
                      <option value="State Board">State Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="Matriculation">Matriculation</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Academic Standard *</label>
                    <select {...register('standard', { required: true })}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching">
                      <option value="">Select Standard *</option>
                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(st => (
                        <option key={st} value={st}>{st} Standard</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Class Section</label>
                    <input type="text" {...register('section')} placeholder="E.g. A, B, C"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Department (11/12th only)</label>
                    <select {...register('department')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching">
                      <option value="">None (Under 11th)</option>
                      <option value="General">General</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Subjects Enrolled (Comma separated)</label>
                    <input type="text" {...register('subjects_enrolled')} placeholder="Tamil, English, Maths, Science"
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                </div>
              </div>

              {/* Fee & Status */}
              <div>
                <p className="text-[10px] text-brand-coaching uppercase tracking-widest font-black mb-3">Fee & Status</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly Fee (₹) *</label>
                    <input type="number" required {...register('monthly_fee')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Joining / Enrollment Date</label>
                    <input type="date" {...register('enrollment_date')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Profile Status</label>
                    <select {...register('status')}
                      className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-brand-coaching">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Profile Notes</label>
                <textarea placeholder="Special notations..." {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none focus:border-brand-coaching" />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-brand-border/30">
                <button type="button" onClick={() => setStudentModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* =======================================================================
          MODAL: ADD/EDIT TEACHER
          ======================================================================= */}
      {staffModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {staffModal.editRecord ? 'Modify Staff Record' : 'Register Teacher Profile'}
            </h3>
            
            <form onSubmit={handleSubmit(handleStaffSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Teacher Name</label>
                <input
                  type="text"
                  required
                  {...register('staff_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    required
                    {...register('mobile')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Subject Speciality</label>
                  <input
                    type="text"
                    placeholder="E.g. Mathematics, Physics"
                    {...register('subject_specialization')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Monthly Payout Salary (₹)</label>
                  <input
                    type="number"
                    required
                    {...register('monthly_salary')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Joining Date</label>
                  <input
                    type="date"
                    {...register('joining_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Profile Status</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Standards taught (Comma separated)</label>
                <input
                  type="text"
                  placeholder="9th, 10th, 11th, 12th"
                  {...register('standards_taught')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStaffModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSaving}
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: INLINE COLLECT FEE
          ======================================================================= */}
      {feeRecordModal.open && feeRecordModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white font-heading">
                Collect Tuition Fee
              </h3>
              <p className="text-[10px] text-brand-coaching font-bold mt-1">
                Student Name: {feeRecordModal.record.student_name} ({feeRecordModal.record.standard})
              </p>
            </div>
            
            <form onSubmit={handleSubmit(handleCollectFeeSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Month</label>
                  <input
                    type="text"
                    disabled
                    value={feeRecordModal.record.month_year}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-500 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Monthly Fee Amount (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={feeRecordModal.record.monthly_fee}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-500 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Date</label>
                  <input
                    type="date"
                    required
                    {...register('paid_date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Mode</label>
                  <select
                    required
                    {...register('payment_mode')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="Cash">Cash Handout</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque Deposit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Receipt Number</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  {...register('receipt_number')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Transaction Notes</label>
                <textarea
                  placeholder="E.g. paid full month, transaction ID..."
                  {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setFeeRecordModal({ open: false, record: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSaving}
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : 'Approve Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default CoachingDashboard;
