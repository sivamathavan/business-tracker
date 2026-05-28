import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Edit2, Trash2, Calendar, User, DollarSign, 
  FileText, BarChart2, Sparkles, BookOpen, Clock, Users, ShieldAlert,
  Percent, AlertTriangle, Printer, Check, Award, Phone, Wallet, GraduationCap, ClipboardList, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatINR, formatDateStr, formatMobileStr } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import { generateFeeReceipt } from '../../utils/pdfGenerator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';

// ==========================================
// INTERFACES
// ==========================================
interface Student {
  student_id: string;
  student_name: string;
  father_name: string | null;
  mother_name: string | null;
  parent_mobile: string;
  student_mobile: string | null;
  standard: string; // '1st' to '12th'
  section: string | null;
  school_name: string | null;
  department: 'General' | 'Science' | 'Commerce' | 'Arts' | null;
  subjects_enrolled: string | null;
  enrollment_date: string | null;
  monthly_fee: number;
  status: 'Active' | 'Inactive' | 'Completed';
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

interface Batch {
  batch_id: string;
  batch_name: string;
  standard: string;
  subject: string | null;
  teacher_name: string | null;
  schedule_days: string | null;
  time_slot: string | null;
  room_number: string | null;
  capacity: number;
  status: 'Active' | 'Holiday' | 'Completed';
}

interface Exam {
  exam_id: string;
  exam_name: string;
  standard: string;
  subject: string | null;
  exam_date: string | null;
  total_marks: number;
}

export const CoachingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'fees' | 'batches' | 'staff' | 'exams' | 'analytics' | 'attendance'>('students');

  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fee Views
  const [feeView, setFeeView] = useState<'history' | 'monthly' | 'overdue'>('monthly');
  const [selectedFeeMonth, setSelectedFeeMonth] = useState('June 2026');
  const [selectedStudentForFees, setSelectedStudentForFees] = useState<Student | null>(null);
  const [studentFeeHistory, setStudentFeeHistory] = useState<FeeRecord[]>([]);
  const [monthlyFeeCollection, setMonthlyFeeCollection] = useState<any[]>([]);
  const [overdueFeesList, setOverdueFeesList] = useState<any[]>([]);

  // Exam Views
  const [examView, setExamView] = useState<'templates' | 'marksheet' | 'report-card'>('templates');
  const [selectedExamForMarks, setSelectedExamForMarks] = useState<Exam | null>(null);
  const [examMarksheet, setExamMarksheet] = useState<any[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [studentReportCard, setStudentReportCard] = useState<any[]>([]);

  // Modals state
  const [studentModal, setStudentModal] = useState<{ open: boolean; editRecord: Student | null }>({ open: false, editRecord: null });
  const [staffModal, setStaffModal] = useState<{ open: boolean; editRecord: Staff | null }>({ open: false, editRecord: null });
  const [batchModal, setBatchModal] = useState<{ open: boolean; editRecord: Batch | null }>({ open: false, editRecord: null });
  const [examModal, setExamModal] = useState<{ open: boolean; editRecord: Exam | null }>({ open: false, editRecord: null });
  const [feeRecordModal, setFeeRecordModal] = useState<{ open: boolean; record: any | null }>({ open: false, record: null });

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studRes, staffRes, batchesRes, examsRes, overdueRes] = await Promise.all([
        apiClient.get('/coaching/students'),
        apiClient.get('/coaching/staff'),
        apiClient.get('/coaching/batches'),
        apiClient.get('/coaching/exams'),
        apiClient.get('/coaching/fees/overdue')
      ]);

      if (studRes.data.success) setStudents(studRes.data.data);
      if (staffRes.data.success) setStaff(staffRes.data.data);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (examsRes.data.success) setExams(examsRes.data.data);
      if (overdueRes.data.success) setOverdueFeesList(overdueRes.data.data);

      // Check for overdue alerts dynamically
      const overdueAlerts = overdueRes.data.data.map((item: any) => ({
        id: `coaching-overdue-${item.student_id}`,
        title: `Overdue Tuition Fees Alert!`,
        message: `${item.student_name} (${item.standard}) is ${item.unpaid_months_count} months overdue. Total: ${formatINR(item.total_amount_due)}`,
        type: 'error',
        section: 'CKS Tuition'
      }));

      useAuthStore.getState().setNotifications(overdueAlerts);
    } catch (e) {
      toast.error('Failed to sync coaching dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'attendance') {
      fetchAttendance(attendanceDate);
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/coaching/analytics');
      if (res.data.success) setAnalytics(res.data.analytics);
    } catch (error) {
      toast.error('Failed to load analytics.');
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

  // Fetch marksheet for specific exam
  const handleLoadExamMarksheet = async (exam: Exam) => {
    setSelectedExamForMarks(exam);
    setExamView('marksheet');
    try {
      const res = await apiClient.get(`/coaching/exams/${exam.exam_id}/marksheet`);
      if (res.data.success) {
        setExamMarksheet(res.data.marksheet);
      }
    } catch (e) {
      toast.error('Failed to load marksheet.');
    }
  };

  // Fetch student report card
  const handleLoadStudentReportCard = async (student: Student) => {
    setSelectedStudentForReport(student);
    setExamView('report-card');
    try {
      const res = await apiClient.get(`/coaching/students/${student.student_id}/report-card`);
      if (res.data.success) {
        setStudentReportCard(res.data.reportCard);
      }
    } catch (e) {
      toast.error('Failed to load report card details.');
    }
  };

  // --- SAVE FORM SUBMITS ---
  const handleStudentSubmit = async (data: any) => {
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
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save student.');
    }
  };

  const handleStaffSubmit = async (data: any) => {
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
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save staff record.');
    }
  };

  const handleBatchSubmit = async (data: any) => {
    try {
      let res;
      if (batchModal.editRecord) {
        res = await apiClient.put(`/coaching/batches/${batchModal.editRecord.batch_id}`, data);
      } else {
        res = await apiClient.post('/coaching/batches', data);
      }
      if (res.data.success) {
        toast.success('Coaching batch schedule saved.');
        setBatchModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save batch.');
    }
  };

  const handleExamSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        total_marks: Number(data.total_marks || 100)
      };

      const res = await apiClient.post('/coaching/exams', payload);
      if (res.data.success) {
        toast.success('Exam template generated.');
        setExamModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to generate exam template.');
    }
  };

  // Inline Fee payment collector
  const handleCollectFeeSubmit = async (data: any) => {
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
        fetchData();
      }
    } catch (e) {
      toast.error('Fee collection failed.');
    }
  };

  // Bulk marks entry submission
  const handleSaveMarksheet = async () => {
    if (!selectedExamForMarks) return;
    const scores = examMarksheet.map(item => ({
      student_id: item.student_id,
      marks_scored: Number(item.marks_scored || 0)
    }));

    try {
      const res = await apiClient.post(`/coaching/exams/${selectedExamForMarks.exam_id}/marksheet`, { scores });
      if (res.data.success) {
        toast.success('Marksheet grades and ranks saved successfully.');
        handleLoadExamMarksheet(selectedExamForMarks);
      }
    } catch (e) {
      toast.error('Failed to save marksheet.');
    }
  };

  const handleAutoGenerateFees = async () => {
    if (!window.confirm('Are you sure you want to auto-generate pending fee records for all active students for this month?')) return;
    try {
      const res = await apiClient.post('/coaching/fees/auto-generate');
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to auto-generate fees');
    }
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

  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm('Delete this coaching batch?')) return;
    try {
      await apiClient.delete(`/coaching/batches/${id}`);
      toast.success('Batch deleted.');
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
    if (!selectedStudentForFees) return;
    
    generateFeeReceipt({
      businessName: 'CKS Tuition',
      businessAddress: '123 Tech Park, Chennai, Tamil Nadu',
      receiptNumber: feeRecord.receipt_number || `REC-${feeRecord.fee_id.substring(0, 8).toUpperCase()}`,
      date: feeRecord.paid_date || new Date().toISOString(),
      studentName: selectedStudentForFees.student_name,
      studentId: selectedStudentForFees.student_id,
      courseOrStandard: selectedStudentForFees.standard,
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-brand-border/40 scrollbar-none print-hidden">
        {[
          { key: 'students', label: 'Coaching Students Register', icon: Users },
          { key: 'fees', label: 'Tuition Fee Management', icon: Wallet },
          { key: 'batches', label: 'Batch Planner', icon: GraduationCap },
          { key: 'attendance', label: 'Attendance Register', icon: Calendar },
          { key: 'staff', label: 'Teachers Registry', icon: User },
          { key: 'exams', label: 'Exams & Scorecards', icon: ClipboardList },
          { key: 'analytics', label: 'Revenue Analytics', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setExamView('templates');
              }}
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

      {/* Hero cards expected vs collected */}
      {analytics && activeTab !== 'attendance' && (
        <RevenueHeroCard
          collected={analytics.totalCollected}
          pending={analytics.totalPending}
          growthRate={22.5}
          type="coaching"
        />
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
                reset({ monthly_fee: 3000 });
                setValue('enrollment_date', new Date().toISOString().split('T')[0]);
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
                  <th className="p-4">Father Name</th>
                  <th className="p-4">Standard</th>
                  <th className="p-4">Dept (11/12th)</th>
                  <th className="p-4">Monthly Fee</th>
                  <th className="p-4">Enroll Date</th>
                  <th className="p-4">Subjects Enrolled</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">WA parent</th>
                  <th className="p-4 text-right print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 text-white font-bold">{s.student_name}</td>
                      <td className="p-4 text-slate-300">{s.father_name || '-'}</td>
                      <td className="p-4 text-brand-coaching font-bold">{s.standard}</td>
                      <td className="p-4 text-slate-400">{s.department || '-'}</td>
                      <td className="p-4 text-white font-bold">{formatINR(s.monthly_fee)}</td>
                      <td className="p-4 text-slate-400">{formatDateStr(s.enrollment_date)}</td>
                      <td className="p-4 text-slate-400 max-w-[150px] truncate" title={s.subjects_enrolled || ''}>{s.subjects_enrolled || '-'}</td>
                      <td className="p-4"><StatusBadge status={s.status} /></td>
                      <td className="p-4 text-center">
                        <WhatsAppButton mobile={s.parent_mobile} />
                      </td>
                      <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleLoadStudentFeeHistory(s)}
                          className="p-1 text-slate-400 hover:text-brand-coaching rounded hover:bg-slate-800"
                          title="View 12-Month tuition payments"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLoadStudentReportCard(s)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                          title="View student report card"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            reset(s);
                            if (s.enrollment_date) setValue('enrollment_date', s.enrollment_date.split('T')[0]);
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
                  ))
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
          {/* Sub menu controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-brand-border/20 print-hidden">
            {[
              { key: 'monthly', label: 'Monthly Collection Matrix' },
              { key: 'overdue', label: 'Overdue Dues List' }
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
                    {['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAutoGenerateFees}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-brand-border/60 rounded-xl text-xs font-black uppercase text-slate-200 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Auto-Generate Month Fees
                </button>
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
                    {monthlyFeeCollection.map(record => (
                      <tr key={record.student_id} className="hover:bg-slate-800/10">
                        <td className="p-4 text-white font-bold">{record.student_name}</td>
                        <td className="p-4 text-brand-coaching">{record.standard}</td>
                        <td className="p-4 text-white font-bold">{formatINR(record.monthly_fee)}</td>
                        <td className="p-4 text-slate-400">{formatDateStr(record.paid_date)}</td>
                        <td className="p-4 text-slate-400">{record.receipt_number || '-'}</td>
                        <td className="p-4"><StatusBadge status={record.status} /></td>
                        <td className="p-4 text-center">
                          <WhatsAppButton mobile={record.parent_mobile} />
                        </td>
                        <td className="p-4 text-right print-hidden">
                          {record.status !== 'Paid' ? (
                            <button
                              onClick={() => setFeeRecordModal({ open: true, record })}
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
                    ))}
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
                        <WhatsAppButton mobile={item.parent_mobile} />
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
                              onClick={() => setFeeRecordModal({ open: true, record: { ...fee, student_name: selectedStudentForFees.student_name, monthly_fee: fee.fee_amount } })}
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
          TAB 3: BATCH PLANNER
          ======================================================================= */}
      {activeTab === 'batches' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Coaching Batches Scheduler
            </h3>
            <button
              onClick={() => {
                reset({ capacity: 25 });
                setBatchModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map((b) => {
              const activeCount = students.filter(s => s.standard === b.standard && s.status === 'Active').length;
              
              return (
                <div key={b.batch_id} className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4 hover:border-brand-coaching/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{b.batch_name}</h4>
                      <p className="text-[10px] text-brand-coaching mt-0.5">{b.standard} Standard | {b.subject || 'All Subjects'}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold bg-brand-dark/40 border border-brand-border/20 rounded-xl p-3">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Timing Slot</p>
                      <p className="text-slate-300 mt-0.5">{b.time_slot || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Schedule Days</p>
                      <p className="text-slate-300 mt-0.5">{b.schedule_days || '-'}</p>
                    </div>
                    <div className="col-span-2 border-t border-brand-border/20 mt-2 pt-2 flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-500">ENROLLED CAPACITY:</span>
                      <span className="text-brand-coaching">{activeCount} / {b.capacity} Students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/20 text-[10px] font-bold text-slate-500">
                    <span>Teacher: {b.teacher_name || '-'}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          reset(b);
                          setBatchModal({ open: true, editRecord: b });
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-brand-coaching"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(b.batch_id)}
                        className="p-1 rounded hover:bg-rose-950/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                reset({ monthly_salary: 20000 });
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
          TAB 6: EXAMS & RESULTS MARK SHEET
          ======================================================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-5">
          {/* Sub Tab headers */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-brand-border/20 print-hidden">
            {[
              { key: 'templates', label: 'Exam Templates' },
              { key: 'marksheet', label: 'Marks Entry Terminal' },
              { key: 'report-card', label: 'Student Report Cards' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setExamView(tab.key as any);
                  if (tab.key !== 'marksheet') setSelectedExamForMarks(null);
                  if (tab.key !== 'report-card') setSelectedStudentForReport(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  examView === tab.key
                    ? 'bg-brand-coaching/15 text-brand-coaching border border-brand-coaching/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* VIEW A: EXAM TEMPLATES */}
          {examView === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between print-hidden">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
                  Coaching Academic Exam Templates
                </h3>
                
                <button
                  onClick={() => {
                    reset({ total_marks: 100 });
                    setValue('exam_date', new Date().toISOString().split('T')[0]);
                    setExamModal({ open: true, editRecord: null });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
                >
                  <Plus className="w-4.5 h-4.5" />
                  Generate Exam Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <div key={exam.exam_id} className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4 hover:border-brand-coaching/40 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{exam.exam_name}</h4>
                      <p className="text-[10px] text-brand-coaching mt-0.5">{exam.standard} Standard | Subject: {exam.subject || 'All'}</p>
                    </div>

                    <div className="flex justify-between items-center bg-brand-dark/40 border border-brand-border/20 rounded-xl p-3 text-xs font-bold">
                      <span className="text-slate-500">Total Marks:</span>
                      <span className="text-slate-200">{exam.total_marks} Marks</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-brand-border/20 text-[10px] font-bold text-slate-500">
                      <span>Date: {formatDateStr(exam.exam_date)}</span>
                      
                      <button
                        onClick={() => handleLoadExamMarksheet(exam)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-brand-border"
                      >
                        Enter Marks
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW B: MARKSHEET ENTRY TERMINAL */}
          {examView === 'marksheet' && selectedExamForMarks && (
            <div className="space-y-4">
              <div className="flex items-center justify-between print-hidden">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Marksheet Entry Terminal: <span className="text-brand-coaching">{selectedExamForMarks.exam_name}</span> ({selectedExamForMarks.standard} - {selectedExamForMarks.subject})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Enter student scores directly into the grid. Grades and pass/fail states are computed as you type!
                  </p>
                </div>
                
                <button
                  onClick={() => setExamView('templates')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-brand-border/60"
                >
                  Back to Templates
                </button>
              </div>

              <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
                <table className="w-full text-left text-xs font-semibold text-slate-300">
                  <thead>
                    <tr className="border-b border-brand-border/40 text-slate-400">
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4 w-32">Marks Scored</th>
                      <th className="p-4">Percentage</th>
                      <th className="p-4">Assigned Grade</th>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    {examMarksheet.map((row, index) => {
                      const total = selectedExamForMarks.total_marks;
                      const getGrade = (marks: number) => {
                        const pct = (marks / total) * 100;
                        if (pct >= 90) return 'A+';
                        if (pct >= 80) return 'A';
                        if (pct >= 70) return 'B';
                        if (pct >= 60) return 'C';
                        if (pct >= 50) return 'D';
                        return 'F';
                      };

                      return (
                        <tr key={row.student_id} className="hover:bg-slate-800/10">
                          <td className="p-4 text-brand-coaching font-bold">{row.roll_number}</td>
                          <td className="p-4 text-white font-bold">{row.student_name}</td>
                          <td className="p-4">
                            <input
                              type="number"
                              max={total}
                              value={row.marks_scored !== null ? row.marks_scored : ''}
                              onChange={(e) => {
                                const val = e.target.value !== '' ? Number(e.target.value) : null;
                                const updated = [...examMarksheet];
                                updated[index].marks_scored = val;
                                if (val !== null) {
                                  updated[index].percentage = Number(((val / total) * 100).toFixed(1));
                                  updated[index].grade = getGrade(val);
                                  updated[index].pass_fail = val >= (total * 0.35) ? 'Pass' : 'Fail';
                                } else {
                                  updated[index].percentage = null;
                                  updated[index].grade = null;
                                  updated[index].pass_fail = null;
                                }
                                setExamMarksheet(updated);
                              }}
                              placeholder={`/ ${total}`}
                              className="w-full max-w-[100px] p-2 bg-slate-950 border border-brand-border rounded-xl text-center text-xs text-white font-bold focus:outline-none focus:border-brand-coaching"
                            />
                          </td>
                          <td className="p-4 text-slate-300">
                            {row.percentage !== null ? `${row.percentage}%` : '-'}
                          </td>
                          <td className="p-4">
                            {row.grade ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                row.grade === 'A+' || row.grade === 'A' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' :
                                row.grade === 'F' ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' :
                                'bg-slate-800 text-slate-400 border border-slate-700/60'
                              }`}>
                                {row.grade}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4 font-bold text-slate-300">{row.rank ? `# ${row.rank}` : '-'}</td>
                          <td className="p-4">
                            {row.pass_fail ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                row.pass_fail === 'Pass' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-rose-950/20 text-rose-400'
                              }`}>
                                {row.pass_fail}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action save trigger */}
              <div className="flex justify-end pt-4 print-hidden">
                <button
                  onClick={handleSaveMarksheet}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-coaching hover:bg-brand-coaching/85 text-white font-black rounded-xl shadow-lg transition-all"
                >
                  <Check className="w-4.5 h-4.5" />
                  Save Scores Registry
                </button>
              </div>
            </div>
          )}

          {/* VIEW C: STUDENT REPORT CARD DETAILS */}
          {examView === 'report-card' && (
            <div className="space-y-5">
              
              {/* Select Student Selector (only shown if not selected yet) */}
              {!selectedStudentForReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {students.map(s => (
                    <button
                      key={s.student_id}
                      onClick={() => handleLoadStudentReportCard(s)}
                      className="rounded-2xl border border-brand-border/60 bg-brand-card p-4 hover:border-indigo-500/40 text-left space-y-2 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <User className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{s.student_name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{s.standard} Standard | section {s.section}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Render printable scorecard template */}
              {selectedStudentForReport && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between print-hidden">
                    <button
                      onClick={() => setSelectedStudentForReport(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-brand-border/60"
                    >
                      Back to Student List
                    </button>
                    
                    <button
                      onClick={handlePrintReportCard}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-all"
                    >
                      <Printer className="w-4.5 h-4.5" />
                      Print Report Card
                    </button>
                  </div>

                  {/* Print Template body */}
                  <div className="rounded-3xl border border-brand-border/60 bg-brand-card p-6 md:p-8 space-y-6 shadow-xl print-container print-area">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
                      <div className="text-left">
                        <h2 className="text-lg md:text-xl font-extrabold text-white font-heading">
                          ⚡ CKS Tuition
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          Tambaram West, Chennai | Academic Report Card
                        </p>
                      </div>
                      <div className="text-left md:text-right text-xs font-bold text-slate-400 space-y-1">
                        <p>Academic Term: <span className="text-slate-200">2025 - 2026</span></p>
                        <p>Generate Date: <span className="text-slate-200">{new Date().toLocaleDateString()}</span></p>
                      </div>
                    </div>

                    {/* Student metadata info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-dark/40 border border-brand-border/20 rounded-2xl p-4 text-xs font-semibold">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">Student Name</p>
                        <p className="text-white font-bold mt-0.5">{selectedStudentForReport.student_name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">Standard & Class</p>
                        <p className="text-brand-coaching font-bold mt-0.5">{selectedStudentForReport.standard} - Section {selectedStudentForReport.section || 'A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">School Name</p>
                        <p className="text-slate-300 mt-0.5">{selectedStudentForReport.school_name || 'Boarding School'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">Father Name</p>
                        <p className="text-slate-300 mt-0.5">{selectedStudentForReport.father_name || '-'}</p>
                      </div>
                    </div>

                    {/* Report Card marks table */}
                    <div className="overflow-x-auto border border-brand-border/40 rounded-2xl">
                      <table className="w-full text-left text-xs font-semibold text-slate-300">
                        <thead>
                          <tr className="bg-brand-border/10 text-slate-400 border-b border-brand-border/40">
                            <th className="p-3">Exam Template</th>
                            <th className="p-3">Subject</th>
                            <th className="p-3">Exam Date</th>
                            <th className="p-3">Total Marks</th>
                            <th className="p-3">Marks Scored</th>
                            <th className="p-3">Percentage</th>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Grade</th>
                            <th className="p-3 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/20">
                          {studentReportCard.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-500">
                                No exam results mapped for this student.
                              </td>
                            </tr>
                          ) : (
                            studentReportCard.map((row) => (
                              <tr key={row.exam_id} className="hover:bg-slate-800/10">
                                <td className="p-3 text-white font-bold">{row.exam_name}</td>
                                <td className="p-3 text-slate-300">{row.subject || 'Maths'}</td>
                                <td className="p-3 text-slate-400">{formatDateStr(row.exam_date)}</td>
                                <td className="p-3 text-slate-400">{row.total_marks}</td>
                                <td className="p-3 text-white font-black">{row.marks_scored}</td>
                                <td className="p-3 text-slate-300">{row.percentage}%</td>
                                <td className="p-3 text-slate-300 font-bold"># {row.rank || '-'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                    row.grade === 'A+' || row.grade === 'A' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' :
                                    row.grade === 'F' ? 'bg-rose-950/20 text-rose-400 border border-rose-900/30' :
                                    'bg-slate-800 text-slate-400 border-slate-700/60'
                                  }`}>
                                    {row.grade}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                    row.pass_fail === 'Pass' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-rose-950/20 text-rose-400'
                                  }`}>
                                    {row.pass_fail}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="pt-8 flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <div className="border-t border-brand-border/40 w-44 pt-2 text-left">
                        Parent Signature
                      </div>
                      <div className="border-t border-brand-border/40 w-44 pt-2 text-right">
                        Center Principal
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* =======================================================================
          TAB 7: REVENUE ANALYTICS
          ======================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
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
          MODAL: REGISTER STUDENT
          ======================================================================= */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {studentModal.editRecord ? 'Modify Student Profile' : 'Register coaching Student'}
            </h3>
            
            <form onSubmit={handleSubmit(handleStudentSubmit)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  {...register('student_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Father Name</label>
                <input
                  type="text"
                  {...register('father_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Mother Name</label>
                <input
                  type="text"
                  {...register('mother_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Parent Mobile (WhatsApp)</label>
                <input
                  type="text"
                  required
                  {...register('parent_mobile')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Student Mobile</label>
                <input
                  type="text"
                  {...register('student_mobile')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">School Name</label>
                <input
                  type="text"
                  {...register('school_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Academic standard</label>
                <select
                  {...register('standard')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(st => (
                    <option key={st} value={st}>{st} Standard</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Class Section</label>
                <input
                  type="text"
                  placeholder="E.g. A, B, C"
                  {...register('section')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Department (11/12th only)</label>
                <select
                  {...register('department')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="">None (Under 11th)</option>
                  <option value="General">General</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Monthly fixed fee (₹)</label>
                <input
                  type="number"
                  required
                  {...register('monthly_fee')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Enrollment Date</label>
                <input
                  type="date"
                  {...register('enrollment_date')}
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
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Subjects enrolled (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Tamil, English, Maths, Science"
                  {...register('subjects_enrolled')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Profile Notes</label>
                <textarea
                  placeholder="Special notations..."
                  {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStudentModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Profile
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
                  type="submit"
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT COACHING BATCH
          ======================================================================= */}
      {batchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {batchModal.editRecord ? 'Modify Batch Settings' : 'Create Coaching Batch'}
            </h3>
            
            <form onSubmit={handleSubmit(handleBatchSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="Secondary Science Batch"
                  {...register('batch_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Target Standard</label>
                  <select
                    {...register('standard')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(st => (
                      <option key={st} value={st}>{st} Standard</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    placeholder="Science, Maths, English"
                    {...register('subject')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Teacher In-Charge</label>
                  <select
                    {...register('teacher_name')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="">Select teacher</option>
                    {staff.map(t => (
                      <option key={t.staff_id} value={t.staff_name}>{t.staff_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Room Identifier</label>
                  <input
                    type="text"
                    placeholder="Room 102"
                    {...register('room_number')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Time Slot</label>
                  <input
                    type="text"
                    placeholder="5:00 PM - 6:30 PM"
                    {...register('time_slot')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Capacity</label>
                  <input
                    type="number"
                    required
                    {...register('capacity')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Schedule Days</label>
                  <input
                    type="text"
                    placeholder="Mon,Wed,Fri"
                    {...register('schedule_days')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Status</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setBatchModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: GENERATE EXAM TEMPLATE
          ======================================================================= */}
      {examModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              Generate Exam Template
            </h3>
            
            <form onSubmit={handleSubmit(handleExamSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Exam Name</label>
                <input
                  type="text"
                  required
                  placeholder="Unit Test 1, Quarterly"
                  {...register('exam_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Target Standard</label>
                  <select
                    {...register('standard')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(st => (
                      <option key={st} value={st}>{st} Standard</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Maths, Science"
                    {...register('subject')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Exam Date</label>
                  <input
                    type="date"
                    {...register('exam_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Total Marks</label>
                  <input
                    type="number"
                    required
                    {...register('total_marks')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setExamModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md"
                >
                  Generate Template
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
                  type="submit"
                  className="px-5 py-2 bg-brand-coaching hover:bg-brand-coaching/85 rounded-xl font-bold text-white shadow-md"
                >
                  Approve Collection
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
