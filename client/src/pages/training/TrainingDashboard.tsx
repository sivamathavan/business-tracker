import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  Plus, Search, Edit2, Trash2, Calendar, FileText, 
  BarChart2, BookOpen, Clock, Tag, ExternalLink, GraduationCap, Users, ClipboardList, Check,
  Pin, User, DollarSign, Sparkles, Link, RefreshCw, FileSpreadsheet, 
  FileDown, CheckCircle, Percent, AlertTriangle, PlayCircle, Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { formatINR, formatDateStr, formatMobileStr } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';
import { ExpensesTab } from '../../components/ui/ExpensesTab';

// ==========================================
// INTERFACES
// ==========================================
interface Course {
  course_id: string;
  course_name: string;
  platform: 'College' | 'Online' | 'YouTube' | 'Udemy' | 'Coursera' | 'Rturox' | 'Other';
  category: 'Web Dev' | 'Mobile' | 'AI/ML' | 'Design' | 'Marketing' | 'DevOps' | 'Other';
  status: 'Not Started' | 'In Progress' | 'Completed';
  total_modules: number;
  completed_modules: number;
  start_date: string | null;
  target_completion_date: string | null;
  certificate_status: 'Not Applicable' | 'Pending' | 'Uploaded';
  skill_tags: string | null;
  resource_url: string | null;
  notes: string | null;
  is_pinned: boolean;
}

interface Student {
  student_id: string;
  student_name: string;
  mobile: string | null;
  email: string | null;
  course_enrolled: string | null;
  batch_name: string | null;
  enrollment_date: string | null;
  total_fee: number;
  status: 'Active' | 'Completed' | 'Dropped';
  notes: string | null;
}

interface Batch {
  batch_id: string;
  batch_name: string;
  course_name: string | null;
  start_date: string | null;
  end_date: string | null;
  schedule_days: string | null;
  time_slot: string | null;
  capacity: number;
  teacher_name: string | null;
  status: 'Upcoming' | 'Active' | 'Completed';
}

interface StudyLog {
  log_id: string;
  log_date: string | null;
  course_name: string | null;
  hours_studied: number;
  topics_covered: string | null;
}

interface FeeInstallment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  status: string;
  payment_mode: string | null;
  receipt_number: string | null;
  notes: string | null;
}

export const TrainingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'batches' | 'attendance' | 'logs' | 'skills' | 'analytics' | 'expenses'>('courses');

  // Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [fees, setFees] = useState<FeeInstallment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Filters & Selected Skill tag
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Modals state
  const [courseModal, setCourseModal] = useState<{ open: boolean; editRecord: Course | null }>({ open: false, editRecord: null });
  const [studentModal, setStudentModal] = useState<{ open: boolean; editRecord: Student | null }>({ open: false, editRecord: null });
  const [batchModal, setBatchModal] = useState<{ open: boolean; editRecord: Batch | null }>({ open: false, editRecord: null });
  const [logModal, setLogModal] = useState<{ open: boolean; editRecord: StudyLog | null }>({ open: false, editRecord: null });

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, studentsRes, batchesRes, logsRes, feesRes] = await Promise.all([
        apiClient.get('/training/courses'),
        apiClient.get('/training/students'),
        apiClient.get('/training/batches'),
        apiClient.get('/training/studylogs'),
        apiClient.get('/training/fees')
      ]);

      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (feesRes.data.success) setFees(feesRes.data.data);

      // Identify overdue personal courses
      const overdueCourses = coursesRes.data.data.filter((c: Course) => {
        const isNotDone = c.status !== 'Completed';
        const isPastTarget = c.target_completion_date && new Date(c.target_completion_date) < new Date();
        return isNotDone && isPastTarget;
      });

      const alerts = overdueCourses.map((c: Course) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(c.target_completion_date!).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: `course-overdue-${c.course_id}`,
          title: `Personal Study Target Overdue!`,
          message: `Course "${c.course_name}" is ${diffDays} days overdue from completion target.`,
          type: 'warning',
          section: 'RturoxAcademy'
        };
      });

      useAuthStore.getState().setNotifications(alerts);
    } catch (e) {
      toast.error('Failed to sync training metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/training/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (e) {
      toast.error('Failed to load training analytics.');
    }
  };

  const fetchAttendance = async (date: string) => {
    try {
      const res = await apiClient.get(`/training/attendance?date=${date}`);
      if (res.data.success) {
        setAttendanceRecords(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load training attendance.');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const res = await apiClient.post('/training/attendance', {
        date: attendanceDate,
        records: attendanceRecords
      });
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (e) {
      toast.error('Failed to save attendance.');
    }
  };

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'skills' || activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'attendance') {
      fetchAttendance(attendanceDate);
    }
  }, [activeTab]);

  // --- SAVE SUBMITS ---
  const handleCourseSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        total_modules: Number(data.total_modules || 1),
        completed_modules: Number(data.completed_modules || 0)
      };

      let res;
      if (courseModal.editRecord) {
        res = await apiClient.put(`/training/courses/${courseModal.editRecord.course_id}`, payload);
      } else {
        res = await apiClient.post('/training/courses', payload);
      }
      if (res.data.success) {
        toast.success('Course progress card saved.');
        setCourseModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save course.');
    }
  };

  const handleStudentSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        total_fee: Number(data.total_fee || 0)
      };

      let res;
      if (studentModal.editRecord) {
        res = await apiClient.put(`/training/students/${studentModal.editRecord.student_id}`, payload);
      } else {
        res = await apiClient.post('/training/students', payload);
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

  const handleBatchSubmit = async (data: any) => {
    try {
      let res;
      if (batchModal.editRecord) {
        res = await apiClient.put(`/training/batches/${batchModal.editRecord.batch_id}`, data);
      } else {
        res = await apiClient.post('/training/batches', data);
      }
      if (res.data.success) {
        toast.success('Batch schedule saved.');
        setBatchModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save batch.');
    }
  };

  const handleLogSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        hours_studied: Number(data.hours_studied || 0)
      };

      let res;
      if (logModal.editRecord) {
        res = await apiClient.put(`/training/studylogs/${logModal.editRecord.log_id}`, payload);
      } else {
        res = await apiClient.post('/training/studylogs', payload);
      }
      if (res.data.success) {
        toast.success('Study hours logged successfully.');
        setLogModal({ open: false, editRecord: null });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save log.');
    }
  };

  // --- PIN CONTROL ---
  const handlePinCourse = async (course: Course) => {
    try {
      const res = await apiClient.put(`/training/courses/${course.course_id}`, {
        is_pinned: !course.is_pinned
      });
      if (res.data.success) {
        toast.success(course.is_pinned ? 'Course unpinned' : 'Course pinned to top!');
        fetchData();
      }
    } catch (e) {
      toast.error('Pin action failed.');
    }
  };

  // --- DELETES ---
  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Delete this course card?')) return;
    try {
      await apiClient.delete(`/training/courses/${id}`);
      toast.success('Course deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Delete student enrollment record?')) return;
    try {
      await apiClient.delete(`/training/students/${id}`);
      toast.success('Student deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm('Delete this training batch?')) return;
    try {
      await apiClient.delete(`/training/batches/${id}`);
      toast.success('Batch deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Delete study log record?')) return;
    try {
      await apiClient.delete(`/training/studylogs/${id}`);
      toast.success('Log deleted.');
      fetchData();
    } catch (e) {
      toast.error('Delete failed.');
    }
  };

  // --- FILTERING LOGIC ---
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.skill_tags?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter ? c.platform === platformFilter : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesTag = selectedTagFilter ? c.skill_tags?.split(',').includes(selectedTagFilter) : true;

    return matchesSearch && matchesPlatform && matchesStatus && matchesTag;
  });

  const sortedCourses = [...filteredCourses].sort((a: any, b: any) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const filteredStudents = students.filter((s) => {
    return s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.course_enrolled && s.course_enrolled.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStudentPaidAmount = (studentId: string) => {
    return fees.filter(f => f.student_id === studentId && f.status === 'Paid').reduce((sum, f) => sum + Number(f.amount), 0);
  };

  // --- EXPORTS ---
  const handleExportCSV = () => {
    const exportData = filteredStudents.map(s => ({
      'Student ID': s.student_id,
      'Student Name': s.student_name,
      'Mobile': s.mobile || '',
      'Email': s.email || '',
      'Course Enrolled': s.course_enrolled || '',
      'Batch': s.batch_name || '',
      'Total Fee': s.total_fee,
      'Amount Paid': getStudentPaidAmount(s.student_id),
      'Balance Due': s.total_fee - getStudentPaidAmount(s.student_id),
      'Status': s.status
    }));
    exportToCSV(exportData, 'rturox_training_students');
  };

  const handleExportPDF = () => {
    const headers = ['Student Name', 'Course Enrolled', 'Batch', 'Total Fee', 'Amount Paid', 'Balance Due', 'Status'];
    const rows = filteredStudents.map(s => [
      s.student_name,
      s.course_enrolled || '-',
      s.batch_name || '-',
      formatINR(s.total_fee),
      formatINR(getStudentPaidAmount(s.student_id)),
      formatINR(s.total_fee - getStudentPaidAmount(s.student_id)),
      s.status
    ]);
    exportToPDF('Rturox Training Student Enrollments', headers, rows, 'rturox_training_students', [67, 233, 123]);
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-8 h-8 border-4 border-brand-training border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold tracking-wider">Syncing Training Dashboard...</p>
      </div>
    );
  }

  const COLORS = ['#43e97b', '#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6 select-none">
      
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-brand-border/40 scrollbar-none print-hidden">
        {[
          { key: 'courses', label: 'Personal Course Tracker', icon: BookOpen },
          { key: 'students', label: 'Tech Students Register', icon: Users },
          { key: 'batches', label: 'Schedules & Batches', icon: Calendar },
          { key: 'attendance', label: 'Attendance', icon: ClipboardList },
          { key: 'logs', label: 'Follow-ups & Logs', icon: FileText },
          { key: 'skills', label: 'Skills Word Cloud', icon: Tag },
          { key: 'analytics', label: 'Enrollments Analytics', icon: BarChart2 },
          { key: 'expenses', label: 'Expense Tracker', icon: Wallet }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setSelectedTagFilter(null);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 focus:outline-none ${
                activeTab === tab.key
                  ? 'bg-brand-training/10 text-brand-training border border-brand-training/30 shadow-[0_0_10px_rgba(67,233,123,0.1)]'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {analytics && activeTab !== 'analytics' && (
        <RevenueHeroCard
          collected={analytics.totalCollected}
          pending={analytics.totalPending}
          growthRate={32.4}
          type="training"
        />
      )}

      {activeTab === 'courses' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search course or tag..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Platforms</option>
                <option value="Rturox">Rturox</option>
                <option value="Udemy">Udemy</option>
                <option value="Coursera">Coursera</option>
                <option value="Online">Online</option>
                <option value="YouTube">YouTube</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {selectedTagFilter && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-training/10 text-brand-training border border-brand-training/20">
                  Tag: {selectedTagFilter}
                  <button onClick={() => setSelectedTagFilter(null)} className="hover:text-rose-400 font-black">×</button>
                </span>
              )}
            </div>

            <button
              onClick={() => {
                reset({ completed_modules: 0, total_modules: 10 });
                setCourseModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all duration-200"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Course Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedCourses.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                No courses match your active search filters.
              </div>
            ) : (
              sortedCourses.map((c) => {
                const progress = Math.min(100, Math.floor((c.completed_modules / (c.total_modules || 1)) * 100));
                const isOverdue = c.status !== 'Completed' && c.target_completion_date && new Date(c.target_completion_date) < new Date();
                
                return (
                  <div 
                    key={c.course_id} 
                    className={`rounded-2xl border bg-brand-card p-5 space-y-4 hover:border-brand-training/40 transition-all duration-200 flex flex-col justify-between ${
                      c.is_pinned ? 'border-brand-training/40 bg-brand-training/5 pulse-glow-emerald' : 'border-brand-border/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-900 border border-brand-border text-slate-400">
                          {c.platform}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePinCourse(c)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              c.is_pinned ? 'text-brand-training' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white font-heading leading-snug line-clamp-2" title={c.course_name}>
                        {c.course_name}
                      </h4>

                      {isOverdue && c.target_completion_date && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[10px] font-bold text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          Target Completion Date Overdue!
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>Progress: {progress}%</span>
                          <span>{c.completed_modules}/{c.total_modules} Modules</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 border border-brand-border/20 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-training to-emerald-400 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {c.skill_tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.skill_tags.split(',').map(tag => (
                            <span 
                              key={tag} 
                              onClick={() => {
                                setSelectedTagFilter(tag.trim());
                                setActiveTab('courses');
                              }}
                              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-brand-training/10 border border-brand-border/40 text-[9px] font-bold text-slate-400 hover:text-brand-training cursor-pointer transition-colors"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-brand-border/20 mt-4 text-[10px] font-bold">
                      <span className="text-slate-500">Target: {formatDateStr(c.target_completion_date)}</span>
                      
                      <div className="flex items-center gap-2">
                        {c.resource_url && (
                          <a 
                            href={c.resource_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Open course platform link"
                          >
                            <Link className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            reset(c);
                            if (c.start_date) setValue('start_date', c.start_date.split('T')[0]);
                            if (c.target_completion_date) setValue('target_completion_date', c.target_completion_date.split('T')[0]);
                            setCourseModal({ open: true, editRecord: c });
                          }}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-brand-training transition-colors"
                          title="Edit course metrics"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.course_id)}
                          className="p-1.5 rounded hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hidden">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student or course..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-brand-border/60 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-brand-border/60 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleExportPDF}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-brand-border/60 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <FileDown className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => {
                  reset({ total_fee: 0 });
                  setValue('enrollment_date', new Date().toISOString().split('T')[0]);
                  setStudentModal({ open: true, editRecord: null });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all"
              >
                <Plus className="w-4.5 h-4.5" />
                Enroll Student
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Student</th>
                  <th className="p-4">Enrolled Course</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Enroll Date</th>
                  <th className="p-4">Total Fee</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">WA</th>
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
                    const amountPaid = getStudentPaidAmount(s.student_id);
                    const balance = s.total_fee - amountPaid;
                    let payStatus = 'Pending';
                    if (amountPaid >= s.total_fee) {
                      payStatus = 'Paid';
                    } else if (amountPaid > 0) {
                      payStatus = 'Partial';
                    }

                    return (
                      <tr key={s.student_id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="p-4 text-white font-bold">{s.student_name}</td>
                        <td className="p-4 text-slate-300">{s.course_enrolled || '-'}</td>
                        <td className="p-4 text-slate-400">{s.batch_name || '-'}</td>
                        <td className="p-4 text-slate-400">{formatDateStr(s.enrollment_date)}</td>
                        <td className="p-4 text-white font-bold">{formatINR(s.total_fee)}</td>
                        <td className="p-4 text-brand-training font-bold">{formatINR(amountPaid)}</td>
                        <td className="p-4 text-amber-400 font-bold">{formatINR(balance)}</td>
                        <td className="p-4"><StatusBadge status={payStatus} /></td>
                        <td className="p-4"><StatusBadge status={s.status} /></td>
                        <td className="p-4 text-center">
                          <WhatsAppButton mobile={s.mobile} />
                        </td>
                        <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              reset(s);
                              if (s.enrollment_date) setValue('enrollment_date', s.enrollment_date.split('T')[0]);
                              setStudentModal({ open: true, editRecord: s });
                            }}
                            className="p-1 text-slate-400 hover:text-brand-training rounded hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.student_id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/20"
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

      {activeTab === 'batches' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Training Batches Scheduler
            </h3>
            <button
              onClick={() => {
                reset({ capacity: 15 });
                setValue('start_date', new Date().toISOString().split('T')[0]);
                setBatchModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              Create Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map((b) => {
              const activeCount = students.filter(s => s.batch_name === b.batch_name && s.status === 'Active').length;
              
              return (
                <div key={b.batch_id} className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 space-y-4 hover:border-brand-training/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{b.batch_name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{b.course_name || 'General Training'}</p>
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
                      <span className="text-brand-training">{activeCount} / {b.capacity} Students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/20 text-[10px] font-bold text-slate-500">
                    <span>Teacher: {b.teacher_name || '-'}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          reset(b);
                          if (b.start_date) setValue('start_date', b.start_date.split('T')[0]);
                          if (b.end_date) setValue('end_date', b.end_date.split('T')[0]);
                          setBatchModal({ open: true, editRecord: b });
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-brand-training"
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

      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
              Training Attendance Register
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
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl text-xs font-black uppercase text-white shadow-md"
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
                  <th className="p-4">Batch</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No active students found.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record, index) => (
                    <tr key={record.student_id} className="hover:bg-slate-800/10">
                      <td className="p-4 text-white font-bold">{record.student_name}</td>
                      <td className="p-4 text-brand-training">{record.batch_name || '-'}</td>
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
                          className="bg-transparent border-b border-brand-border/50 text-slate-400 w-full focus:outline-none focus:border-brand-training text-[11px]"
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

      {activeTab === 'logs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between print-hidden">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
                Study Log Entry (Weekly Trackers)
              </h3>
              {analytics && (
                <p className="text-[10px] text-brand-training font-black uppercase mt-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Weekly study hours logged: {analytics.weeklyStudyHours} Hours
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                reset({ hours_studied: 2 });
                setValue('log_date', new Date().toISOString().split('T')[0]);
                setLogModal({ open: true, editRecord: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl text-xs font-black uppercase text-white shadow-md transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              Log Study Hours
            </button>
          </div>

          <div className="overflow-x-auto bg-brand-card/75 border border-brand-border/60 rounded-3xl backdrop-blur-md">
            <table className="w-full text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-brand-border/40 text-slate-400">
                  <th className="p-4">Study Date</th>
                  <th className="p-4">Course Name</th>
                  <th className="p-4">Hours Studied</th>
                  <th className="p-4">Topics Covered</th>
                  <th className="p-4 text-right print-hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/20">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 text-slate-400">{formatDateStr(log.log_date)}</td>
                    <td className="p-4 text-white font-bold">{log.course_name || '-'}</td>
                    <td className="p-4 text-brand-training font-bold">{log.hours_studied} Hrs</td>
                    <td className="p-4 text-slate-300 max-w-sm truncate" title={log.topics_covered || ''}>
                      {log.topics_covered || '-'}
                    </td>
                    <td className="p-4 text-right print-hidden space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          reset(log);
                          if (log.log_date) setValue('log_date', log.log_date.split('T')[0]);
                          setLogModal({ open: true, editRecord: log });
                        }}
                        className="p-1 text-slate-400 hover:text-brand-training rounded hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.log_id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'skills' && analytics && (
        <div className="rounded-3xl border border-brand-border/60 bg-brand-card p-8 shadow-lg space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-white font-heading">
              Personal Learning Skills Word Cloud
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Font sizing matches the frequency count of these tags across your active courses. Click any tag to filter courses!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-8 bg-brand-dark/40 border border-brand-border/20 rounded-2xl p-6 min-h-[220px]">
            {analytics.skillsCloud.map((tag: any) => {
              // Map count to standard Tailwind font-size classes
              let sizeClass = 'text-xs font-semibold';
              if (tag.value >= 4) sizeClass = 'text-2xl font-black text-brand-training shadow-glow';
              else if (tag.value === 3) sizeClass = 'text-xl font-extrabold text-emerald-300';
              else if (tag.value === 2) sizeClass = 'text-sm font-bold text-slate-200';
              
              return (
                <button
                  key={tag.name}
                  onClick={() => {
                    setSelectedTagFilter(tag.name);
                    setActiveTab('courses');
                    toast(`Courses filtered by skill tag: #${tag.name}`, { icon: '🏷️' });
                  }}
                  className={`px-3 py-1.5 rounded-xl border border-brand-border/60 hover:border-brand-training/60 bg-[#12121a] hover:bg-brand-training/5 transition-all duration-200 uppercase tracking-wide focus:outline-none select-none active:scale-95 ${sizeClass}`}
                >
                  {tag.name}
                  <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-slate-900 border border-brand-border/40 text-slate-500 font-semibold tracking-normal group-hover:bg-brand-training/10">
                    {tag.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 6: ANALYTICS
          ======================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly enrollment bar chart */}
            <div className="lg:col-span-2 rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Monthly Student Enrollments (12 Months Trend)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrend} margin={{ left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a/40" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="enrollments" fill="#43e97b" radius={[4, 4, 0, 0]} name="New Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student status breakdown */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Student Enrollment Status Breakdown
              </h4>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie
                      data={analytics.studentStatuses}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.studentStatuses.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePie>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-around text-xs font-bold mt-2">
                <div className="flex items-center gap-1.5 text-brand-training">
                  <span className="w-3 h-3 rounded-full bg-[#43e97b]"></span>
                  Active
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Completed
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Dropped
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Course-wise revenue */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Fee Collections by Course Enrolled (INR ₹)
              </h4>
              <div className="divide-y divide-brand-border/20 max-h-60 overflow-y-auto">
                {analytics.courseBreakdown.map((item: any) => (
                  <div key={item.name} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{item.name}</span>
                    <span className="text-brand-training font-bold">{formatINR(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch-wise revenue */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-heading mb-4">
                Fee Collections by Training Batch (INR ₹)
              </h4>
              <div className="divide-y divide-brand-border/20 max-h-60 overflow-y-auto">
                {analytics.batchBreakdown.map((item: any) => (
                  <div key={item.name} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{item.name}</span>
                    <span className="text-brand-training font-bold">{formatINR(item.value)}</span>
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
        <ExpensesTab businessSlug="training" onSave={fetchData} />
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT COURSE CARD
          ======================================================================= */}
      {courseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {courseModal.editRecord ? 'Modify Course progress card' : 'Track New Course Card'}
            </h3>
            
            <form onSubmit={handleSubmit(handleCourseSubmit)} className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter complete course title"
                  {...register('course_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Study Platform</label>
                <select
                  {...register('platform')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="College">College</option>
                  <option value="Online">Online</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Udemy">Udemy</option>
                  <option value="Coursera">Coursera</option>
                  <option value="Rturox">Rturox</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  {...register('category')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="Web Dev">Web Dev</option>
                  <option value="Mobile">Mobile</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Course Status</label>
                <select
                  {...register('status')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Certificate Status</label>
                <select
                  {...register('certificate_status')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="Not Applicable">Not Applicable</option>
                  <option value="Pending">Pending</option>
                  <option value="Uploaded">Uploaded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Completed Modules</label>
                <input
                  type="number"
                  {...register('completed_modules')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Total Modules</label>
                <input
                  type="number"
                  {...register('total_modules')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Target Completion Date</label>
                <input
                  type="date"
                  {...register('target_completion_date')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Skill Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="React 18, TypeScript, Zustand"
                  {...register('skill_tags')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Resource URL</label>
                <input
                  type="text"
                  placeholder="Github link, Udemy dashboard, etc."
                  {...register('resource_url')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Description Notes</label>
                <textarea
                  placeholder="What was learned..."
                  {...register('notes')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setCourseModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT STUDENT ENROLLMENT
          ======================================================================= */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {studentModal.editRecord ? 'Modify Student Profile' : 'Enroll Student'}
            </h3>
            
            <form onSubmit={handleSubmit(handleStudentSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter student name"
                  {...register('student_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    {...register('mobile')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                        {/* amount_paid removed from this modal */}          <label className="text-[10px] text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Course Enrolled</label>
                  <select
                    {...register('course_enrolled')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Scheduler</label>
                  <select
                    {...register('batch_name')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="">Select batch</option>
                    {batches.map(b => (
                      <option key={b.batch_id} value={b.batch_name}>{b.batch_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Total Fees Expected (₹)</label>
                  <input
                    type="number"
                    required
                    {...register('total_fee')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Enrollment Date</label>
                  <input
                    type="date"
                    {...register('enrollment_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStudentModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD/EDIT BATCH
          ======================================================================= */}
      {batchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {batchModal.editRecord ? 'Modify Batch Settings' : 'Create Training Batch'}
            </h3>
            
            <form onSubmit={handleSubmit(handleBatchSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="React Batch A"
                  {...register('batch_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Associated Course</label>
                <select
                  {...register('course_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="">Select course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Time Slot</label>
                  <input
                    type="text"
                    placeholder="E.g. 6:00 PM – 8:00 PM"
                    {...register('time_slot')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Max Capacity</label>
                  <input
                    type="number"
                    required
                    {...register('capacity')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Teacher Name</label>
                <input
                  type="text"
                  {...register('teacher_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    {...register('start_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    {...register('end_date')}
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
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    {...register('status')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
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
                  className="px-5 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: LOG STUDY HOURS
          ======================================================================= */}
      {logModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-[#161623] border border-brand-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white font-heading">
              {logModal.editRecord ? 'Modify Log Parameters' : 'Log Study Hours'}
            </h3>
            
            <form onSubmit={handleSubmit(handleLogSubmit)} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Course Studied</label>
                <select
                  {...register('course_name')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                >
                  <option value="">Select course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_name}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Study Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    {...register('hours_studied')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">Study Date</label>
                  <input
                    type="date"
                    required
                    {...register('log_date')}
                    className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Topics Covered</label>
                <textarea
                  placeholder="E.g. studied React state and hooks"
                  {...register('topics_covered')}
                  className="w-full p-2.5 bg-slate-950 border border-brand-border rounded-xl text-slate-200 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setLogModal({ open: false, editRecord: null })}
                  className="px-4 py-2 rounded-xl border border-brand-border hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-training hover:bg-brand-training/85 rounded-xl font-bold text-white shadow-md"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default TrainingDashboard;
