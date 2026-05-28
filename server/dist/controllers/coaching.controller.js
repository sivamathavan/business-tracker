"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCoachingAttendance = exports.getCoachingAttendance = exports.autoGenerateMonthlyFees = exports.getCoachingAnalytics = exports.deleteCoachingBatch = exports.updateCoachingBatch = exports.createCoachingBatch = exports.getCoachingBatches = exports.deleteCoachingStaff = exports.updateCoachingStaff = exports.createCoachingStaff = exports.getCoachingStaff = exports.getStudentReportCardData = exports.saveBulkExamResults = exports.getExamMarksheet = exports.createExam = exports.getExams = exports.getOverdueFeesList = exports.getMonthlyCollection = exports.upsertFeeRecord = exports.getStudentFees = exports.deleteCoachingStudent = exports.updateCoachingStudent = exports.createCoachingStudent = exports.getCoachingStudents = void 0;
const prisma_1 = require("../prisma");
const activityLogger_1 = require("../utils/activityLogger");
const auth_controller_1 = require("./auth.controller");
// ==========================================
// STUDENT MANAGEMENT
// ==========================================
const getCoachingStudents = async (req, res, next) => {
    try {
        const students = await prisma_1.prisma.coachingStudent.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: students });
    }
    catch (error) {
        next(error);
    }
};
exports.getCoachingStudents = getCoachingStudents;
const createCoachingStudent = async (req, res, next) => {
    try {
        const { student_name, father_name, mother_name, parent_mobile, student_mobile, standard, section, school_name, department, subjects_enrolled, enrollment_date, monthly_fee, status, notes } = req.body;
        const student = await prisma_1.prisma.coachingStudent.create({
            data: {
                student_name,
                father_name,
                mother_name,
                parent_mobile: (0, auth_controller_1.cleanMobile)(parent_mobile),
                student_mobile: student_mobile ? (0, auth_controller_1.cleanMobile)(student_mobile) : null,
                standard,
                section,
                school_name,
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
        await prisma_1.prisma.coachingFeeRecord.create({
            data: {
                student_id: student.student_id,
                month_year: currentMonthYear,
                fee_amount: student.monthly_fee,
                status: 'Pending',
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'CREATE', `Coaching Student: ${student_name}`);
        return res.status(201).json({ success: true, data: student });
    }
    catch (error) {
        next(error);
    }
};
exports.createCoachingStudent = createCoachingStudent;
const updateCoachingStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { student_name, father_name, mother_name, parent_mobile, student_mobile, standard, section, school_name, department, subjects_enrolled, enrollment_date, monthly_fee, status, notes } = req.body;
        const existing = await prisma_1.prisma.coachingStudent.findUnique({ where: { student_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Coaching student not found' });
        const updated = await prisma_1.prisma.coachingStudent.update({
            where: { student_id: id },
            data: {
                student_name: student_name || existing.student_name,
                father_name: father_name !== undefined ? father_name : existing.father_name,
                mother_name: mother_name !== undefined ? mother_name : existing.mother_name,
                parent_mobile: parent_mobile ? (0, auth_controller_1.cleanMobile)(parent_mobile) : existing.parent_mobile,
                student_mobile: student_mobile !== undefined ? (student_mobile ? (0, auth_controller_1.cleanMobile)(student_mobile) : null) : existing.student_mobile,
                standard: standard || existing.standard,
                section: section !== undefined ? section : existing.section,
                school_name: school_name !== undefined ? school_name : existing.school_name,
                department: department !== undefined ? department : existing.department,
                subjects_enrolled: subjects_enrolled !== undefined ? (Array.isArray(subjects_enrolled) ? subjects_enrolled.join(',') : subjects_enrolled) : existing.subjects_enrolled,
                enrollment_date: enrollment_date !== undefined ? (enrollment_date ? new Date(enrollment_date) : null) : existing.enrollment_date,
                monthly_fee: monthly_fee !== undefined ? Number(monthly_fee) : existing.monthly_fee,
                status: status || existing.status,
                notes: notes !== undefined ? notes : existing.notes
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Coaching Student: ${updated.student_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCoachingStudent = updateCoachingStudent;
const deleteCoachingStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await prisma_1.prisma.coachingStudent.findUnique({ where: { student_id: id } });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        await prisma_1.prisma.coachingStudent.update({
            where: { student_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'DELETE', `Coaching Student: ${student.student_name}`);
        return res.status(200).json({ success: true, message: 'Coaching student deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCoachingStudent = deleteCoachingStudent;
// ==========================================
// FEE MANAGEMENT SECTION
// ==========================================
const getStudentFees = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const records = await prisma_1.prisma.coachingFeeRecord.findMany({
            where: { student_id: studentId, deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: records });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentFees = getStudentFees;
const upsertFeeRecord = async (req, res, next) => {
    try {
        const { student_id, month_year, fee_amount, paid_date, payment_mode, receipt_number, status, notes } = req.body;
        const existing = await prisma_1.prisma.coachingFeeRecord.findFirst({
            where: { student_id, month_year, deleted_at: null }
        });
        let record;
        if (existing) {
            record = await prisma_1.prisma.coachingFeeRecord.update({
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
        }
        else {
            record = await prisma_1.prisma.coachingFeeRecord.create({
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
        const student = await prisma_1.prisma.coachingStudent.findUnique({ where: { student_id } });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Fee Paid: ${student?.student_name} for ${month_year}`);
        return res.status(200).json({ success: true, data: record });
    }
    catch (error) {
        next(error);
    }
};
exports.upsertFeeRecord = upsertFeeRecord;
// Lists all active students and their fee status for a specific month
const getMonthlyCollection = async (req, res, next) => {
    try {
        const { monthYear } = req.query;
        if (!monthYear) {
            return res.status(400).json({ success: false, message: 'monthYear query parameter is required (e.g. June 2026)' });
        }
        const students = await prisma_1.prisma.coachingStudent.findMany({
            where: { status: 'Active', deleted_at: null }
        });
        const feeRecords = await prisma_1.prisma.coachingFeeRecord.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMonthlyCollection = getMonthlyCollection;
const getOverdueFeesList = async (req, res, next) => {
    try {
        const students = await prisma_1.prisma.coachingStudent.findMany({
            where: { status: 'Active', deleted_at: null }
        });
        const unpaidRecords = await prisma_1.prisma.coachingFeeRecord.findMany({
            where: {
                status: { in: ['Pending', 'Overdue'] },
                deleted_at: null
            }
        });
        const overdueList = students.map(s => {
            const studentUnpaid = unpaidRecords.filter(r => r.student_id === s.student_id);
            if (studentUnpaid.length === 0)
                return null;
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
    }
    catch (error) {
        next(error);
    }
};
exports.getOverdueFeesList = getOverdueFeesList;
// ==========================================
// EXAMS & RESULTS SECTION
// ==========================================
const getExams = async (req, res, next) => {
    try {
        const exams = await prisma_1.prisma.coachingExam.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: exams });
    }
    catch (error) {
        next(error);
    }
};
exports.getExams = getExams;
const createExam = async (req, res, next) => {
    try {
        const { exam_name, standard, subject, exam_date, total_marks } = req.body;
        const exam = await prisma_1.prisma.coachingExam.create({
            data: {
                exam_name,
                standard,
                subject,
                exam_date: exam_date ? new Date(exam_date) : null,
                total_marks: Number(total_marks || 100),
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'CREATE', `Exam Template: ${exam_name} for ${standard}`);
        return res.status(201).json({ success: true, data: exam });
    }
    catch (error) {
        next(error);
    }
};
exports.createExam = createExam;
// Returns all students for the standard of this exam, along with their marks
const getExamMarksheet = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await prisma_1.prisma.coachingExam.findUnique({ where: { exam_id: examId } });
        if (!exam || exam.deleted_at) {
            return res.status(404).json({ success: false, message: 'Exam template not found' });
        }
        const students = await prisma_1.prisma.coachingStudent.findMany({
            where: { standard: exam.standard, status: 'Active', deleted_at: null }
        });
        const results = await prisma_1.prisma.coachingResult.findMany({
            where: { exam_id: examId, deleted_at: null }
        });
        // Helper grade and pass calculation
        const getGrade = (marks, total) => {
            const pct = (marks / total) * 100;
            if (pct >= 90)
                return 'A+';
            if (pct >= 80)
                return 'A';
            if (pct >= 70)
                return 'B';
            if (pct >= 60)
                return 'C';
            if (pct >= 50)
                return 'D';
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
    }
    catch (error) {
        next(error);
    }
};
exports.getExamMarksheet = getExamMarksheet;
// Bulletproof bulk inline exam score insertion
const saveBulkExamResults = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { scores } = req.body; // Array of { student_id, marks_scored }
        if (!Array.isArray(scores)) {
            return res.status(400).json({ success: false, message: 'scores payload must be a JSON array' });
        }
        const exam = await prisma_1.prisma.coachingExam.findUnique({ where: { exam_id: examId } });
        if (!exam)
            return res.status(404).json({ success: false, message: 'Exam template not found' });
        for (const item of scores) {
            const existing = await prisma_1.prisma.coachingResult.findFirst({
                where: { exam_id: examId, student_id: item.student_id, deleted_at: null }
            });
            if (existing) {
                await prisma_1.prisma.coachingResult.update({
                    where: { result_id: existing.result_id },
                    data: {
                        marks_scored: Number(item.marks_scored),
                    }
                });
            }
            else {
                await prisma_1.prisma.coachingResult.create({
                    data: {
                        exam_id: examId,
                        student_id: item.student_id,
                        marks_scored: Number(item.marks_scored),
                        created_by: req.user?.userId || 'system'
                    }
                });
            }
        }
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Exam scores saved for: ${exam.exam_name} (${exam.standard})`);
        return res.status(200).json({ success: true, message: 'Exam scores updated successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.saveBulkExamResults = saveBulkExamResults;
// Generates complete student report card mapping
const getStudentReportCardData = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const student = await prisma_1.prisma.coachingStudent.findUnique({ where: { student_id: studentId } });
        if (!student || student.deleted_at) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }
        const results = await prisma_1.prisma.coachingResult.findMany({
            where: { student_id: studentId, deleted_at: null }
        });
        const examIds = results.map(r => r.exam_id);
        const exams = await prisma_1.prisma.coachingExam.findMany({
            where: { exam_id: { in: examIds }, deleted_at: null }
        });
        const allStandardResults = await prisma_1.prisma.coachingResult.findMany({
            where: { exam_id: { in: examIds }, deleted_at: null }
        });
        const getGrade = (marks, total) => {
            const pct = (marks / total) * 100;
            if (pct >= 90)
                return 'A+';
            if (pct >= 80)
                return 'A';
            if (pct >= 70)
                return 'B';
            if (pct >= 60)
                return 'C';
            if (pct >= 50)
                return 'D';
            return 'F';
        };
        const reportCard = results.map(resRecord => {
            const ex = exams.find(e => e.exam_id === resRecord.exam_id);
            if (!ex)
                return null;
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
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentReportCardData = getStudentReportCardData;
// ==========================================
// STAFF & BATCHES SECTION
// ==========================================
const getCoachingStaff = async (req, res, next) => {
    try {
        const staff = await prisma_1.prisma.coachingStaff.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: staff });
    }
    catch (error) {
        next(error);
    }
};
exports.getCoachingStaff = getCoachingStaff;
const createCoachingStaff = async (req, res, next) => {
    try {
        const { staff_name, mobile, email, subject_specialization, standards_taught, joining_date, monthly_salary, status, notes } = req.body;
        const staff = await prisma_1.prisma.coachingStaff.create({
            data: {
                staff_name,
                mobile: (0, auth_controller_1.cleanMobile)(mobile),
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
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'CREATE', `Staff: ${staff_name}`);
        return res.status(201).json({ success: true, data: staff });
    }
    catch (error) {
        next(error);
    }
};
exports.createCoachingStaff = createCoachingStaff;
const updateCoachingStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { staff_name, mobile, email, subject_specialization, standards_taught, joining_date, monthly_salary, status, notes } = req.body;
        const existing = await prisma_1.prisma.coachingStaff.findUnique({ where: { staff_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        const updated = await prisma_1.prisma.coachingStaff.update({
            where: { staff_id: id },
            data: {
                staff_name: staff_name || existing.staff_name,
                mobile: mobile ? (0, auth_controller_1.cleanMobile)(mobile) : existing.mobile,
                email: email !== undefined ? email : existing.email,
                subject_specialization: subject_specialization !== undefined ? subject_specialization : existing.subject_specialization,
                standards_taught: standards_taught !== undefined ? (Array.isArray(standards_taught) ? standards_taught.join(',') : standards_taught) : existing.standards_taught,
                joining_date: joining_date !== undefined ? (joining_date ? new Date(joining_date) : null) : existing.joining_date,
                monthly_salary: monthly_salary !== undefined ? Number(monthly_salary) : existing.monthly_salary,
                status: status || existing.status,
                notes: notes !== undefined ? notes : existing.notes
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Staff: ${updated.staff_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCoachingStaff = updateCoachingStaff;
const deleteCoachingStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const staff = await prisma_1.prisma.coachingStaff.findUnique({ where: { staff_id: id } });
        if (!staff)
            return res.status(404).json({ success: false, message: 'Staff not found' });
        await prisma_1.prisma.coachingStaff.update({
            where: { staff_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'DELETE', `Staff: ${staff.staff_name}`);
        return res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCoachingStaff = deleteCoachingStaff;
// Batches & Schedule
const getCoachingBatches = async (req, res, next) => {
    try {
        const batches = await prisma_1.prisma.coachingBatch.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: batches });
    }
    catch (error) {
        next(error);
    }
};
exports.getCoachingBatches = getCoachingBatches;
const createCoachingBatch = async (req, res, next) => {
    try {
        const { batch_name, standard, subject, teacher_name, schedule_days, time_slot, room_number, capacity, status } = req.body;
        const batch = await prisma_1.prisma.coachingBatch.create({
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
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'CREATE', `Coaching Batch: ${batch_name}`);
        return res.status(201).json({ success: true, data: batch });
    }
    catch (error) {
        next(error);
    }
};
exports.createCoachingBatch = createCoachingBatch;
const updateCoachingBatch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { batch_name, standard, subject, teacher_name, schedule_days, time_slot, room_number, capacity, status } = req.body;
        const existing = await prisma_1.prisma.coachingBatch.findUnique({ where: { batch_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Batch not found' });
        const updated = await prisma_1.prisma.coachingBatch.update({
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
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Coaching Batch: ${updated.batch_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCoachingBatch = updateCoachingBatch;
const deleteCoachingBatch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const batch = await prisma_1.prisma.coachingBatch.findUnique({ where: { batch_id: id } });
        if (!batch)
            return res.status(404).json({ success: false, message: 'Batch not found' });
        await prisma_1.prisma.coachingBatch.update({
            where: { batch_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'DELETE', `Coaching Batch: ${batch.batch_name}`);
        return res.status(200).json({ success: true, message: 'Batch deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCoachingBatch = deleteCoachingBatch;
// ==========================================
// COACHING ANALYTICS SECTION
// ==========================================
const getCoachingAnalytics = async (req, res, next) => {
    try {
        const activeStudents = await prisma_1.prisma.coachingStudent.findMany({
            where: { status: 'Active', deleted_at: null }
        });
        const feeRecords = await prisma_1.prisma.coachingFeeRecord.findMany({
            where: { deleted_at: null }
        });
        const staff = await prisma_1.prisma.coachingStaff.findMany({
            where: { status: 'Active', deleted_at: null }
        });
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
        const totalCollected = feeRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + Number(r.fee_amount), 0);
        const totalPending = feeRecords.filter(r => r.status === 'Pending' || r.status === 'Overdue').reduce((sum, r) => sum + Number(r.fee_amount), 0);
        // 3. Standard wise revenue breakdown
        const standardRevenue = {};
        activeStudents.forEach(s => {
            const studentPaidRecords = feeRecords.filter(r => r.student_id === s.student_id && r.status === 'Paid');
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
    }
    catch (error) {
        next(error);
    }
};
exports.getCoachingAnalytics = getCoachingAnalytics;
// --- Auto Monthly Fee Generation ---
const autoGenerateMonthlyFees = async (req, res, next) => {
    try {
        const activeStudents = await prisma_1.prisma.coachingStudent.findMany({
            where: { status: 'Active', deleted_at: null }
        });
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthYear = `${months[now.getMonth()]} ${now.getFullYear()}`;
        let generatedCount = 0;
        for (const student of activeStudents) {
            // Check if a fee record already exists for this student and this month
            const existing = await prisma_1.prisma.coachingFeeRecord.findFirst({
                where: {
                    student_id: student.student_id,
                    month_year: currentMonthYear,
                    deleted_at: null
                }
            });
            if (!existing) {
                await prisma_1.prisma.coachingFeeRecord.create({
                    data: {
                        student_id: student.student_id,
                        month_year: currentMonthYear,
                        fee_amount: student.monthly_fee,
                        status: 'Pending',
                        created_by: 'system_auto'
                    }
                });
                generatedCount++;
            }
        }
        await (0, activityLogger_1.logActivity)('system_auto', 'Rturox Coaching Centre', 'CREATE', `Auto-generated ${generatedCount} fee records for ${currentMonthYear}`);
        return res.status(200).json({ success: true, message: `Successfully generated ${generatedCount} pending fee records for ${currentMonthYear}` });
    }
    catch (error) {
        next(error);
    }
};
exports.autoGenerateMonthlyFees = autoGenerateMonthlyFees;
// ==========================================
// ATTENDANCE
// ==========================================
const getCoachingAttendance = async (req, res, next) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        const queryDate = date ? new Date(date) : new Date();
        // find all active students
        const students = await prisma_1.prisma.coachingStudent.findMany({
            where: { status: 'Active', deleted_at: null },
            select: { student_id: true, student_name: true, standard: true }
        });
        const records = await prisma_1.prisma.coachingAttendance.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getCoachingAttendance = getCoachingAttendance;
const markCoachingAttendance = async (req, res, next) => {
    try {
        const { date, records } = req.body;
        // records: [{ student_id, status, notes }]
        const queryDate = new Date(date);
        for (const r of records) {
            if (r.status === 'Not Marked')
                continue;
            const existing = await prisma_1.prisma.coachingAttendance.findFirst({
                where: { student_id: r.student_id, date: queryDate }
            });
            if (existing) {
                await prisma_1.prisma.coachingAttendance.update({
                    where: { id: existing.id },
                    data: { status: r.status, notes: r.notes }
                });
            }
            else {
                await prisma_1.prisma.coachingAttendance.create({
                    data: {
                        student_id: r.student_id,
                        date: queryDate,
                        status: r.status,
                        notes: r.notes
                    }
                });
            }
        }
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'Rturox Coaching Centre', 'UPDATE', `Marked attendance for ${date}`);
        return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.markCoachingAttendance = markCoachingAttendance;
