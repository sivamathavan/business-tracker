import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';
import { cleanMobile } from './auth.controller';

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

export const getCoachingStudents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.coachingStudent.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: { CoachingAttendance: true }
    });

    const studentsWithAttendance = students.map(student => {
      const records = student.CoachingAttendance;
      let attendance_percentage = 0;
      
      if (records && records.length > 0) {
        const presentCount = records.filter(r => r.status === 'Present').length;
        attendance_percentage = Math.round((presentCount / records.length) * 100);
      }

      // Remove the raw array from response to save bandwidth
      const { CoachingAttendance, ...rest } = student;
      return { ...rest, attendance_percentage };
    });

    return res.status(200).json({ success: true, data: studentsWithAttendance });
  } catch (error) {
    next(error);
  }
};

export const createCoachingStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      student_name,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      whatsapp_number,
      phone_number,
      parent_mobile,
      student_mobile,
      standard,
      section,
      school_name,
      medium,
      board,
      department,
      subjects_enrolled,
      enrollment_date,
      monthly_fee,
      status,
      notes
    } = req.body;

    // Use whatsapp_number or phone_number as the primary contact for backward compat
    const primaryMobile = whatsapp_number || phone_number || parent_mobile;

    const student = await prisma.coachingStudent.create({
      data: {
        student_name,
        father_name,
        father_occupation,
        mother_name,
        mother_occupation,
        whatsapp_number: whatsapp_number ? cleanMobile(whatsapp_number) : null,
        phone_number: phone_number ? cleanMobile(phone_number) : null,
        parent_mobile: primaryMobile ? cleanMobile(primaryMobile) : null,
        student_mobile: student_mobile ? cleanMobile(student_mobile) : null,
        standard,
        section,
        school_name,
        medium,
        board,
        department,
        subjects_enrolled: Array.isArray(subjects_enrolled) ? subjects_enrolled.join(',') : subjects_enrolled,
        enrollment_date: enrollment_date ? new Date(enrollment_date) : null,
        monthly_fee: Number(monthly_fee || 0),
        status,
        notes,
        created_by: req.user?.userId || 'system'
      }
    });

    // Automatically seed a fee record for the current month when a student is created
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthYear = `${months[now.getMonth()]} ${now.getFullYear()}`;

    await prisma.coachingFeeRecord.create({
      data: {
        student_id: student.student_id,
        month_year: currentMonthYear,
        fee_amount: student.monthly_fee,
        status: 'Pending',
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'CREATE', `Coaching Student: ${student_name}`);

    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const updateCoachingStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      student_name,
      father_name,
      father_occupation,
      mother_name,
      mother_occupation,
      whatsapp_number,
      phone_number,
      parent_mobile,
      student_mobile,
      standard,
      section,
      school_name,
      medium,
      board,
      department,
      subjects_enrolled,
      enrollment_date,
      monthly_fee,
      status,
      notes
    } = req.body;

    const existing = await prisma.coachingStudent.findUnique({ where: { student_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Coaching student not found' });

    const feeChanged = monthly_fee !== undefined && Number(monthly_fee) > 0 && Number(monthly_fee) !== Number(existing.monthly_fee);

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.coachingStudent.update({
        where: { student_id: id },
        data: {
          student_name: student_name || existing.student_name,
          father_name: father_name !== undefined ? father_name : existing.father_name,
          father_occupation: father_occupation !== undefined ? father_occupation : existing.father_occupation,
          mother_name: mother_name !== undefined ? mother_name : existing.mother_name,
          mother_occupation: mother_occupation !== undefined ? mother_occupation : existing.mother_occupation,
          whatsapp_number: whatsapp_number !== undefined ? (whatsapp_number ? cleanMobile(whatsapp_number) : null) : existing.whatsapp_number,
          phone_number: phone_number !== undefined ? (phone_number ? cleanMobile(phone_number) : null) : existing.phone_number,
          parent_mobile: parent_mobile !== undefined ? (parent_mobile ? cleanMobile(parent_mobile) : null) : existing.parent_mobile,
          student_mobile: student_mobile !== undefined ? (student_mobile ? cleanMobile(student_mobile) : null) : existing.student_mobile,
          standard: standard || existing.standard,
          section: section !== undefined ? section : existing.section,
          school_name: school_name !== undefined ? school_name : existing.school_name,
          medium: medium !== undefined ? medium : existing.medium,
          board: board !== undefined ? board : existing.board,
          department: department !== undefined ? department : existing.department,
          subjects_enrolled: subjects_enrolled !== undefined ? (Array.isArray(subjects_enrolled) ? subjects_enrolled.join(',') : subjects_enrolled) : existing.subjects_enrolled,
          enrollment_date: enrollment_date !== undefined ? (enrollment_date ? new Date(enrollment_date) : null) : existing.enrollment_date,
          monthly_fee: monthly_fee !== undefined ? Number(monthly_fee) : existing.monthly_fee,
          status: status || existing.status,
          notes: notes !== undefined ? notes : existing.notes
        }
      });

      // Sync new fee amount to open records atomically; skip if fee is 0 (blank field guard)
      if (feeChanged) {
        await tx.coachingFeeRecord.updateMany({
          where: { student_id: id, status: { in: ['Pending', 'Overdue'] }, deleted_at: null },
          data: { fee_amount: Number(monthly_fee) }
        });
      }

      return record;
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Coaching Student: ${updated.student_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoachingStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const student = await prisma.coachingStudent.findUnique({ where: { student_id: id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const now = new Date();

    // Fix 1: Cascade soft-delete to all child records in a single atomic transaction
    await prisma.$transaction([
      prisma.coachingStudent.update({ where: { student_id: id }, data: { deleted_at: now } }),
      prisma.coachingFeeRecord.updateMany({ where: { student_id: id, deleted_at: null }, data: { deleted_at: now } }),
      prisma.coachingAttendance.updateMany({ where: { student_id: id, deleted_at: null }, data: { deleted_at: now } }),
      prisma.coachingResult.updateMany({ where: { student_id: id, deleted_at: null }, data: { deleted_at: now } }),
      prisma.coachingEnrollment.deleteMany({ where: { student_id: id } })
    ]);

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'DELETE', `Coaching Student: ${student.student_name}`);

    return res.status(200).json({ success: true, message: 'Coaching student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FEE MANAGEMENT SECTION
// ==========================================

export const getStudentFees = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const records = await prisma.coachingFeeRecord.findMany({
      where: { student_id: studentId, deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const upsertFeeRecord = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { student_id, month_year, fee_amount, paid_date, payment_mode, receipt_number, status, notes } = req.body;

    const existing = await prisma.coachingFeeRecord.findFirst({
      where: { student_id, month_year, deleted_at: null }
    });

    let record;
    if (existing) {
      record = await prisma.coachingFeeRecord.update({
        where: { fee_id: existing.fee_id },
        data: {
          fee_amount: fee_amount !== undefined ? Number(fee_amount) : existing.fee_amount,
          paid_date: paid_date ? new Date(paid_date) : existing.paid_date,
          payment_mode: payment_mode || existing.payment_mode,
          receipt_number: receipt_number || existing.receipt_number,
          status: status || existing.status,
          notes: notes !== undefined ? notes : existing.notes
        }
      });
    } else {
      record = await prisma.coachingFeeRecord.create({
        data: {
          student_id,
          month_year,
          fee_amount: Number(fee_amount),
          paid_date: paid_date ? new Date(paid_date) : null,
          payment_mode,
          receipt_number: receipt_number || `REC-${Date.now().toString().slice(-6)}`,
          status,
          notes,
          created_by: req.user?.userId || 'system'
        }
      });
    }

    const student = await prisma.coachingStudent.findUnique({ where: { student_id } });
    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Fee Paid: ${student?.student_name} for ${month_year}`);

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// Lists all active students and their fee status for a specific month
export const getMonthlyCollection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { monthYear } = req.query;
    if (!monthYear) {
      return res.status(400).json({ success: false, message: 'monthYear query parameter is required (e.g. June 2026)' });
    }

    const students = await prisma.coachingStudent.findMany({
      where: { status: 'Active', deleted_at: null }
    });

    const feeRecords = await prisma.coachingFeeRecord.findMany({
      where: { month_year: String(monthYear), deleted_at: null }
    });

    // Merge students with their fee records
    const data = students.map(s => {
      const record = feeRecords.find(r => r.student_id === s.student_id);
      return {
        student_id: s.student_id,
        student_name: s.student_name,
        standard: s.standard,
        parent_mobile: s.parent_mobile,
        monthly_fee: Number(s.monthly_fee),
        fee_id: record?.fee_id || null,
        paid_date: record?.paid_date || null,
        payment_mode: record?.payment_mode || null,
        receipt_number: record?.receipt_number || null,
        status: record?.status || 'Pending',
        notes: record?.notes || '',
        month_year: String(monthYear)
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getOverdueFeesList = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.coachingStudent.findMany({
      where: { status: 'Active', deleted_at: null }
    });

    const unpaidRecords = await prisma.coachingFeeRecord.findMany({
      where: {
        status: { in: ['Pending', 'Overdue'] },
        deleted_at: null
      }
    });

    const overdueList = students.map(s => {
      const studentUnpaid = unpaidRecords.filter(r => r.student_id === s.student_id);
      if (studentUnpaid.length === 0) return null;

      const totalAmountDue = studentUnpaid.reduce((sum, r) => sum + Number(r.fee_amount), 0);

      return {
        student_id: s.student_id,
        student_name: s.student_name,
        standard: s.standard,
        parent_mobile: s.parent_mobile,
        monthly_fee: Number(s.monthly_fee),
        unpaid_months_count: studentUnpaid.length,
        unpaid_months: studentUnpaid.map(r => r.month_year),
        total_amount_due: totalAmountDue
      };
    }).filter(item => item !== null);

    return res.status(200).json({ success: true, data: overdueList });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXAMS & RESULTS SECTION
// ==========================================

export const getExams = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const exams = await prisma.coachingExam.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { exam_name, standard, subject, exam_date, total_marks } = req.body;

    const exam = await prisma.coachingExam.create({
      data: {
        exam_name,
        standard,
        subject,
        exam_date: exam_date ? new Date(exam_date) : null,
        total_marks: Number(total_marks || 100),
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'CREATE', `Exam Template: ${exam_name} for ${standard}`);

    return res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { exam_name, standard, subject, exam_date, total_marks } = req.body;

    const exam = await prisma.coachingExam.findUnique({ where: { exam_id: id } });
    if (!exam || exam.deleted_at) {
      return res.status(404).json({ success: false, message: 'Exam template not found' });
    }

    const updated = await prisma.coachingExam.update({
      where: { exam_id: id },
      data: {
        exam_name: exam_name || exam.exam_name,
        standard: standard || exam.standard,
        subject: subject !== undefined ? subject : exam.subject,
        exam_date: exam_date ? new Date(exam_date) : exam.exam_date,
        total_marks: total_marks ? Number(total_marks) : exam.total_marks
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Exam Template: ${updated.exam_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const exam = await prisma.coachingExam.findUnique({ where: { exam_id: id } });
    if (!exam || exam.deleted_at) {
      return res.status(404).json({ success: false, message: 'Exam template not found' });
    }

    await prisma.coachingExam.update({
      where: { exam_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'DELETE', `Exam Template: ${exam.exam_name}`);

    return res.status(200).json({ success: true, message: 'Exam template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Returns all students for the standard of this exam, along with their marks
export const getExamMarksheet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.coachingExam.findUnique({ where: { exam_id: examId } });
    if (!exam || exam.deleted_at) {
      return res.status(404).json({ success: false, message: 'Exam template not found' });
    }

    const students = await prisma.coachingStudent.findMany({
      where: { standard: exam.standard, status: 'Active', deleted_at: null }
    });

    const results = await prisma.coachingResult.findMany({
      where: { exam_id: examId, deleted_at: null }
    });

    // Helper grade and pass calculation
    const getGrade = (marks: number, total: number) => {
      const pct = (marks / total) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B';
      if (pct >= 60) return 'C';
      if (pct >= 50) return 'D';
      return 'F';
    };

    // Calculate ranks on the fly for seeded results
    const sortedResults = [...results].sort((a, b) => Number(b.marks_scored) - Number(a.marks_scored));

    const data = students.map(s => {
      const resRecord = results.find(r => r.student_id === s.student_id);
      const score = resRecord ? Number(resRecord.marks_scored) : null;
      const rankIdx = score !== null ? sortedResults.findIndex(r => r.student_id === s.student_id) : -1;

      return {
        student_id: s.student_id,
        student_name: s.student_name,
        roll_number: s.student_id.slice(0, 5).toUpperCase(),
        marks_scored: score,
        percentage: score !== null ? Number(((score / exam.total_marks) * 100).toFixed(1)) : null,
        grade: score !== null ? getGrade(score, exam.total_marks) : null,
        pass_fail: score !== null ? (score >= (exam.total_marks * 0.35) ? 'Pass' : 'Fail') : null,
        rank: rankIdx !== -1 ? rankIdx + 1 : null,
        result_id: resRecord?.result_id || null
      };
    });

    return res.status(200).json({
      success: true,
      exam: {
        exam_id: exam.exam_id,
        exam_name: exam.exam_name,
        standard: exam.standard,
        subject: exam.subject,
        total_marks: exam.total_marks
      },
      marksheet: data
    });
  } catch (error) {
    next(error);
  }
};

// Bulletproof bulk inline exam score insertion
export const saveBulkExamResults = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.params;
    const { scores } = req.body; // Array of { student_id, marks_scored }

    if (!Array.isArray(scores)) {
      return res.status(400).json({ success: false, message: 'scores payload must be a JSON array' });
    }

    const exam = await prisma.coachingExam.findUnique({ where: { exam_id: examId } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam template not found' });

    for (const item of scores) {
      const existing = await prisma.coachingResult.findFirst({
        where: { exam_id: examId, student_id: item.student_id, deleted_at: null }
      });

      if (existing) {
        await prisma.coachingResult.update({
          where: { result_id: existing.result_id },
          data: {
            marks_scored: Number(item.marks_scored),
          }
        });
      } else {
        await prisma.coachingResult.create({
          data: {
            exam_id: examId,
            student_id: item.student_id,
            marks_scored: Number(item.marks_scored),
            created_by: req.user?.userId || 'system'
          }
        });
      }
    }

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Exam scores saved for: ${exam.exam_name} (${exam.standard})`);

    return res.status(200).json({ success: true, message: 'Exam scores updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Generates complete student report card mapping
export const getStudentReportCardData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.coachingStudent.findUnique({ where: { student_id: studentId } });
    if (!student || student.deleted_at) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const results = await prisma.coachingResult.findMany({
      where: { student_id: studentId, deleted_at: null }
    });

    const examIds = results.map(r => r.exam_id);
    const exams = await prisma.coachingExam.findMany({
      where: { exam_id: { in: examIds }, deleted_at: null }
    });

    const allStandardResults = await prisma.coachingResult.findMany({
      where: { exam_id: { in: examIds }, deleted_at: null }
    });

    const getGrade = (marks: number, total: number) => {
      const pct = (marks / total) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B';
      if (pct >= 60) return 'C';
      if (pct >= 50) return 'D';
      return 'F';
    };

    const reportCard = results.map(resRecord => {
      const ex = exams.find(e => e.exam_id === resRecord.exam_id);
      if (!ex) return null;

      // Calculate rank dynamically
      const examResults = allStandardResults
        .filter(r => r.exam_id === resRecord.exam_id)
        .sort((a, b) => Number(b.marks_scored) - Number(a.marks_scored));

      const rankIdx = examResults.findIndex(r => r.student_id === studentId);

      const score = Number(resRecord.marks_scored);

      return {
        exam_id: ex.exam_id,
        exam_name: ex.exam_name,
        subject: ex.subject,
        exam_date: ex.exam_date,
        total_marks: ex.total_marks,
        marks_scored: score,
        percentage: Number(((score / ex.total_marks) * 100).toFixed(1)),
        grade: getGrade(score, ex.total_marks),
        pass_fail: score >= (ex.total_marks * 0.35) ? 'Pass' : 'Fail',
        rank: rankIdx !== -1 ? rankIdx + 1 : null
      };
    }).filter(item => item !== null);

    return res.status(200).json({
      success: true,
      student: {
        student_id: student.student_id,
        student_name: student.student_name,
        standard: student.standard,
        section: student.section,
        school_name: student.school_name,
        parent_mobile: student.parent_mobile
      },
      reportCard
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STAFF & BATCHES SECTION
// ==========================================

export const getCoachingStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const staff = await prisma.coachingStaff.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const createCoachingStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { staff_name, mobile, email, subject_specialization, standards_taught, joining_date, monthly_salary, status, notes } = req.body;

    const staff = await prisma.coachingStaff.create({
      data: {
        staff_name,
        mobile: cleanMobile(mobile),
        email,
        subject_specialization,
        standards_taught: Array.isArray(standards_taught) ? standards_taught.join(',') : standards_taught,
        joining_date: joining_date ? new Date(joining_date) : null,
        monthly_salary: Number(monthly_salary || 0),
        status,
        notes,
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'CREATE', `Staff: ${staff_name}`);

    return res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const updateCoachingStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { staff_name, mobile, email, subject_specialization, standards_taught, joining_date, monthly_salary, status, notes } = req.body;

    const existing = await prisma.coachingStaff.findUnique({ where: { staff_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Staff profile not found' });

    const updated = await prisma.coachingStaff.update({
      where: { staff_id: id },
      data: {
        staff_name: staff_name || existing.staff_name,
        mobile: mobile ? cleanMobile(mobile) : existing.mobile,
        email: email !== undefined ? email : existing.email,
        subject_specialization: subject_specialization !== undefined ? subject_specialization : existing.subject_specialization,
        standards_taught: standards_taught !== undefined ? (Array.isArray(standards_taught) ? standards_taught.join(',') : standards_taught) : existing.standards_taught,
        joining_date: joining_date !== undefined ? (joining_date ? new Date(joining_date) : null) : existing.joining_date,
        monthly_salary: monthly_salary !== undefined ? Number(monthly_salary) : existing.monthly_salary,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Staff: ${updated.staff_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoachingStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staff = await prisma.coachingStaff.findUnique({ where: { staff_id: id } });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    await prisma.coachingStaff.update({
      where: { staff_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'DELETE', `Staff: ${staff.staff_name}`);

    return res.status(200).json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Batches & Schedule
export const getCoachingBatches = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const batches = await prisma.coachingBatch.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { CoachingEnrollments: true }
        }
      }
    });

    const formattedBatches = batches.map(b => {
      const { _count, ...rest } = b;
      return { ...rest, active_count: _count.CoachingEnrollments };
    });

    return res.status(200).json({ success: true, data: formattedBatches });
  } catch (error) {
    next(error);
  }
};

export const createCoachingBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { batch_name, standard, subject, teacher_name, schedule_days, time_slot, room_number, capacity, status } = req.body;

    const batch = await prisma.coachingBatch.create({
      data: {
        batch_name,
        standard,
        subject,
        teacher_name,
        schedule_days: Array.isArray(schedule_days) ? schedule_days.join(',') : schedule_days,
        time_slot,
        room_number,
        capacity: Number(capacity || 0),
        status,
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'CREATE', `Coaching Batch: ${batch_name}`);

    return res.status(201).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

export const updateCoachingBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { batch_name, standard, subject, teacher_name, schedule_days, time_slot, room_number, capacity, status } = req.body;

    const existing = await prisma.coachingBatch.findUnique({ where: { batch_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Batch not found' });

    const updated = await prisma.coachingBatch.update({
      where: { batch_id: id },
      data: {
        batch_name: batch_name || existing.batch_name,
        standard: standard || existing.standard,
        subject: subject !== undefined ? subject : existing.subject,
        teacher_name: teacher_name !== undefined ? teacher_name : existing.teacher_name,
        schedule_days: schedule_days !== undefined ? (Array.isArray(schedule_days) ? schedule_days.join(',') : schedule_days) : existing.schedule_days,
        time_slot: time_slot !== undefined ? time_slot : existing.time_slot,
        room_number: room_number !== undefined ? room_number : existing.room_number,
        capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
        status: status || existing.status
      }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Coaching Batch: ${updated.batch_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoachingBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const batch = await prisma.coachingBatch.findUnique({ where: { batch_id: id } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    await prisma.coachingBatch.update({
      where: { batch_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'DELETE', `Coaching Batch: ${batch.batch_name}`);

    return res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COACHING ANALYTICS SECTION
// ==========================================

export const getCoachingAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [activeStudents, feeRecords, staff] = await Promise.all([
      prisma.coachingStudent.findMany({
        where: { status: 'Active', deleted_at: null },
        select: { student_id: true, monthly_fee: true, standard: true }
      }),
      prisma.coachingFeeRecord.findMany({
        where: { deleted_at: null },
        select: { student_id: true, month_year: true, fee_amount: true, status: true, paid_date: true }
      }),
      prisma.coachingStaff.findMany({
        where: { status: 'Active', deleted_at: null },
        select: { monthly_salary: true }
      })
    ]);

    const { month, startDate, endDate } = req.query;
    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;
    
    if (startDate && endDate) {
      filterStart = new Date(startDate as string);
      filterEnd = new Date(new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000);
    } else if (month && typeof month === 'string') {
      const [year, mon] = month.split('-').map(Number);
      if (year && mon) {
        filterStart = new Date(year, mon - 1, 1);
        filterEnd = new Date(year, mon, 1);
      }
    }

    const isWithinFilter = (d: Date | string | null | undefined) => {
      if (!filterStart || !filterEnd) return true;
      if (!d) return false; // exclude dateless records when a filter is active
      const date = new Date(d);
      return date >= filterStart && date < filterEnd;
    };

    // 1. Total monthly expected = sum(active students * their monthly fee)
    const totalExpectedThisMonth = activeStudents.reduce((sum, s) => sum + Number(s.monthly_fee), 0);

    // 2. Total collected this month & pending this month
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthYear = `${months[now.getMonth()]} ${now.getFullYear()}`;

    const currentMonthRecords = feeRecords.filter(r => r.month_year === currentMonthYear);
    
    const collectedThisMonth = currentMonthRecords
      .filter(r => r.status === 'Paid')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);

    const pendingThisMonth = currentMonthRecords
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);

    const overdueTotalAmount = feeRecords
      .filter(r => r.status === 'Overdue')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);

    // All-time for consistency with Admin
    const filteredFees = feeRecords.filter(r => isWithinFilter(r.paid_date));
    const totalCollected = filteredFees.filter(r => r.status === 'Paid').reduce((sum, r) => sum + Number(r.fee_amount), 0);
    
    // Pending shouldn't be fully bound by date filter if it's "still owed" globally, 
    // but we can just use the global total pending for the snapshot.
    const totalPending = feeRecords.filter(r => r.status === 'Pending' || r.status === 'Overdue').reduce((sum, r) => sum + Number(r.fee_amount), 0);

    // 3. Standard wise revenue breakdown
    const standardRevenue: Record<string, number> = {};
    activeStudents.forEach(s => {
      const studentPaidRecords = filteredFees.filter(r => r.student_id === s.student_id && r.status === 'Paid');
      const paidSum = studentPaidRecords.reduce((sum, r) => sum + Number(r.fee_amount), 0);
      standardRevenue[s.standard] = (standardRevenue[s.standard] || 0) + paidSum;
    });

    const standardBreakdown = Object.entries(standardRevenue).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    // 4. Monthly Collection Trends (last 12 months)
    const monthlyTrend = months.map((m, idx) => {
      const monthStr = `${m} ${now.getFullYear()}`;
      const monthRecords = feeRecords.filter(r => r.month_year === monthStr);
      
      const collected = monthRecords
        .filter(r => r.status === 'Paid')
        .reduce((sum, r) => sum + Number(r.fee_amount), 0);

      const expected = monthRecords.reduce((sum, r) => sum + Number(r.fee_amount), 0);

      return {
        name: m.slice(0, 3),
        collected,
        expected
      };
    });

    // 5. Staff salaries vs revenues (Profit indicator)
    const staffSalaryTotal = staff.reduce((sum, member) => sum + Number(member.monthly_salary), 0);
    const overallFeesCollected = feeRecords
      .filter(r => r.status === 'Paid')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);
    const overallFeesPending = feeRecords
      .filter(r => r.status === 'Pending' || r.status === 'Overdue')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);

    return res.status(200).json({
      success: true,
      analytics: {
        totalExpectedThisMonth,
        collectedThisMonth,
        pendingThisMonth,
        overdueTotalAmount,
        staffSalaryTotal,
        overallFeesCollected,
        overallFeesPending,
        standardBreakdown,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Dashboard Summary ---
export const getCoachingDashboardSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [students, feeRecords, staff] = await Promise.all([
      prisma.coachingStudent.findMany({
        where: { deleted_at: null },
      }),
      prisma.coachingFeeRecord.findMany({
        where: { deleted_at: null },
      }),
      prisma.coachingStaff.findMany({
        where: { deleted_at: null },
      })
    ]);

    const activeStudents = students.filter(s => s.status === 'Active');
    
    // Key Metrics
    const totalStudentsCount = students.length;
    const activeStudentsCount = activeStudents.length;
    
    // Monthly Fee (full collection expected for active)
    const monthlyFeeExpected = activeStudents.reduce((sum, s) => sum + Number(s.monthly_fee), 0);
    
    // Billed to Date (Total expected from all fee records ever created)
    const billedToDate = feeRecords.reduce((sum, r) => sum + Number(r.fee_amount), 0);
    
    // Total Collected
    const totalCollected = feeRecords
      .filter(r => r.status === 'Paid')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);
      
    // Total Outstanding
    const totalOutstanding = feeRecords
      .filter(r => r.status === 'Pending' || r.status === 'Overdue')
      .reduce((sum, r) => sum + Number(r.fee_amount), 0);
      
    // Collection % — returned as a number, not a string
    const collectionPercentage = billedToDate > 0 ? Number(((totalCollected / billedToDate) * 100).toFixed(1)) : 0;

    // By Standard — build a lookup map to avoid O(N*M) scans
    const studentMap = new Map(students.map(s => [s.student_id, s]));

    const standardsObj: Record<string, any> = {};
    // Seed slots from ALL students so inactive students' fee records are allocated
    students.forEach(s => {
      if (!standardsObj[s.standard]) {
        standardsObj[s.standard] = { standard: s.standard, students: 0, billed: 0, collected: 0, due: 0 };
      }
    });
    // Count only active students in the student column
    activeStudents.forEach(s => {
      standardsObj[s.standard].students += 1;
    });

    feeRecords.forEach(r => {
      const student = studentMap.get(r.student_id);
      if (student && standardsObj[student.standard]) {
        standardsObj[student.standard].billed += Number(r.fee_amount);
        if (r.status === 'Paid') {
          standardsObj[student.standard].collected += Number(r.fee_amount);
        } else {
          standardsObj[student.standard].due += Number(r.fee_amount);
        }
      }
    });
    
    // Ensure all standards 1-12 are present
    const standardOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
    standardOrder.forEach(st => {
      if (!standardsObj[st]) {
        standardsObj[st] = { standard: st, students: 0, billed: 0, collected: 0, due: 0 };
      }
    });
    const byStandard = Object.values(standardsObj).sort((a: any, b: any) => standardOrder.indexOf(a.standard) - standardOrder.indexOf(b.standard));

    // By Medium — seed from all students, count only active
    const mediumObj: Record<string, any> = {};
    students.forEach(s => {
      const med = s.medium || 'Unknown';
      if (!mediumObj[med]) {
        mediumObj[med] = { medium: med, students: 0, collected: 0, due: 0 };
      }
    });
    activeStudents.forEach(s => {
      const med = s.medium || 'Unknown';
      mediumObj[med].students += 1;
    });

    feeRecords.forEach(r => {
      const student = studentMap.get(r.student_id);
      if (student) {
        const med = student.medium || 'Unknown';
        if (mediumObj[med]) {
          if (r.status === 'Paid') {
            mediumObj[med].collected += Number(r.fee_amount);
          } else {
            mediumObj[med].due += Number(r.fee_amount);
          }
        }
      }
    });
    const byMedium = Object.values(mediumObj);

    // Staff & Salary
    const activeStaff = staff.filter(s => s.status === 'Active');
    const totalStaffCount = activeStaff.length;
    const monthlySalaryFull = activeStaff.reduce((sum, s) => sum + Number(s.monthly_salary), 0);

    return res.status(200).json({
      success: true,
      dashboard: {
        keyMetrics: {
          totalStudents: totalStudentsCount,
          activeStudents: activeStudentsCount,
          monthlyFeeExpected,
          billedToDate,
          totalCollected,
          totalOutstanding,
          collectionPercentage
        },
        byStandard,
        byMedium,
        staffSalary: {
          totalStaff: totalStaffCount,
          monthlySalaryFull
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Auto Monthly Fee Generation ---
export const autoGenerateMonthlyFees = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { monthYear } = req.body;
    const activeStudents = await prisma.coachingStudent.findMany({
      where: { status: 'Active', deleted_at: null }
    });

    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const targetMonthYear = monthYear || `${months[now.getMonth()]} ${now.getFullYear()}`;

    // Fetch all existing records for this month in one query, then bulk-create missing ones
    const existingRecords = await prisma.coachingFeeRecord.findMany({
      where: {
        month_year: targetMonthYear,
        deleted_at: null,
        student_id: { in: activeStudents.map(s => s.student_id) }
      },
      select: { student_id: true }
    });
    const alreadyHasFee = new Set(existingRecords.map(r => r.student_id));

    const toCreate = activeStudents.filter(s => !alreadyHasFee.has(s.student_id));
    if (toCreate.length > 0) {
      await prisma.coachingFeeRecord.createMany({
        data: toCreate.map(s => ({
          student_id: s.student_id,
          month_year: targetMonthYear,
          fee_amount: s.monthly_fee,
          status: 'Pending',
          created_by: 'system_auto'
        }))
      });
    }
    const generatedCount = toCreate.length;

    await logActivity('system_auto', 'AchieversNest', 'CREATE', `Auto-generated ${generatedCount} fee records for ${targetMonthYear}`);

    return res.status(200).json({ success: true, message: `Successfully generated ${generatedCount} pending fee records for ${targetMonthYear}` });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ATTENDANCE
// ==========================================

export const getCoachingAttendance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    
    // Normalize to start of day UTC for reliable Date matching
    const queryDate = new Date(String(date));
    queryDate.setUTCHours(0, 0, 0, 0);
    
    // find all active students
    const students = await prisma.coachingStudent.findMany({
      where: { status: 'Active', deleted_at: null },
      select: { student_id: true, student_name: true, standard: true }
    });

    const records = await prisma.coachingAttendance.findMany({
      where: { date: queryDate, deleted_at: null }
    });

    const attendanceList = students.map(s => {
      const rec = records.find(r => r.student_id === s.student_id);
      return {
        student_id: s.student_id,
        student_name: s.student_name,
        standard: s.standard,
        status: rec ? rec.status : 'Not Marked',
        notes: rec ? rec.notes : '',
        id: rec ? rec.id : null
      };
    });

    return res.status(200).json({ success: true, data: attendanceList, date: queryDate });
  } catch (error) { next(error); }
};

export const markCoachingAttendance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { date, records } = req.body; 
    // records: [{ student_id, status, notes }]
    
    // Normalize to start of day UTC
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    for (const r of records) {
      if (r.status === 'Not Marked') continue;

      const existing = await prisma.coachingAttendance.findFirst({
        where: { student_id: r.student_id, date: queryDate }
      });

      if (existing) {
        await prisma.coachingAttendance.update({
          where: { id: existing.id },
          data: { status: r.status, notes: r.notes }
        });
      } else {
        await prisma.coachingAttendance.create({
          data: {
            student_id: r.student_id,
            date: queryDate,
            status: r.status,
            notes: r.notes
          }
        });
      }
    }

    await logActivity(req.user?.userId || 'system', 'AchieversNest', 'UPDATE', `Marked attendance for ${date}`);
    return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) { next(error); }
};
