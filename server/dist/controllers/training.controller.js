"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markTrainingAttendance = exports.getTrainingAttendance = exports.deleteTrainingFeeInstallment = exports.updateTrainingFeeInstallment = exports.createTrainingFeeInstallment = exports.getTrainingFeeInstallments = exports.getTrainingAnalytics = exports.deleteStudyLog = exports.updateStudyLog = exports.createStudyLog = exports.getStudyLogs = exports.deleteBatch = exports.updateBatch = exports.createBatch = exports.getBatches = exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.getStudents = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourses = void 0;
const prisma_1 = require("../prisma");
const activityLogger_1 = require("../utils/activityLogger");
const auth_controller_1 = require("./auth.controller");
// ==========================================
// COURSES SECTION
// ==========================================
const getCourses = async (req, res, next) => {
    try {
        const courses = await prisma_1.prisma.trainingCourse.findMany({
            where: { deleted_at: null },
            orderBy: [
                { is_pinned: 'desc' },
                { created_at: 'desc' }
            ]
        });
        return res.status(200).json({ success: true, data: courses });
    }
    catch (error) {
        next(error);
    }
};
exports.getCourses = getCourses;
const createCourse = async (req, res, next) => {
    try {
        const { course_name, platform, category, status, total_modules, completed_modules, start_date, target_completion_date, certificate_status, skill_tags, resource_url, notes } = req.body;
        const course = await prisma_1.prisma.trainingCourse.create({
            data: {
                course_name,
                platform,
                category,
                status,
                total_modules: Number(total_modules || 1),
                completed_modules: Number(completed_modules || 0),
                start_date: start_date ? new Date(start_date) : null,
                target_completion_date: target_completion_date ? new Date(target_completion_date) : null,
                certificate_status,
                skill_tags,
                resource_url,
                notes,
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'CREATE', `Course: ${course_name}`);
        return res.status(201).json({ success: true, data: course });
    }
    catch (error) {
        next(error);
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { course_name, platform, category, status, total_modules, completed_modules, start_date, target_completion_date, certificate_status, skill_tags, resource_url, notes, is_pinned } = req.body;
        const existing = await prisma_1.prisma.trainingCourse.findUnique({ where: { course_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Course not found' });
        const updated = await prisma_1.prisma.trainingCourse.update({
            where: { course_id: id },
            data: {
                course_name: course_name || existing.course_name,
                platform: platform || existing.platform,
                category: category || existing.category,
                status: status || existing.status,
                total_modules: total_modules !== undefined ? Number(total_modules) : existing.total_modules,
                completed_modules: completed_modules !== undefined ? Number(completed_modules) : existing.completed_modules,
                start_date: start_date !== undefined ? (start_date ? new Date(start_date) : null) : existing.start_date,
                target_completion_date: target_completion_date !== undefined ? (target_completion_date ? new Date(target_completion_date) : null) : existing.target_completion_date,
                certificate_status: certificate_status || existing.certificate_status,
                skill_tags: skill_tags !== undefined ? skill_tags : existing.skill_tags,
                resource_url: resource_url !== undefined ? resource_url : existing.resource_url,
                notes: notes !== undefined ? notes : existing.notes,
                is_pinned: is_pinned !== undefined ? is_pinned : existing.is_pinned
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'UPDATE', `Course: ${updated.course_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await prisma_1.prisma.trainingCourse.findUnique({ where: { course_id: id } });
        if (!course)
            return res.status(404).json({ success: false, message: 'Course not found' });
        await prisma_1.prisma.trainingCourse.update({
            where: { course_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'DELETE', `Course: ${course.course_name}`);
        return res.status(200).json({ success: true, message: 'Course deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCourse = deleteCourse;
// ==========================================
// STUDENTS SECTION
// ==========================================
const getStudents = async (req, res, next) => {
    try {
        const students = await prisma_1.prisma.trainingStudent.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: students });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudents = getStudents;
const createStudent = async (req, res, next) => {
    try {
        const { student_name, mobile, email, course_enrolled, batch_name, enrollment_date, total_fee, status, notes } = req.body;
        const newStudent = await prisma_1.prisma.trainingStudent.create({
            data: {
                student_name,
                mobile: mobile ? (0, auth_controller_1.cleanMobile)(mobile) : null,
                email,
                course_enrolled,
                batch_name,
                enrollment_date: enrollment_date ? new Date(enrollment_date) : null,
                total_fee: Number(total_fee || 0),
                status: status || 'Active',
                notes,
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'CREATE', `Student: ${student_name}`);
        return res.status(201).json({ success: true, data: newStudent });
    }
    catch (error) {
        next(error);
    }
};
exports.createStudent = createStudent;
const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { student_name, mobile, email, course_enrolled, batch_name, enrollment_date, total_fee, status, notes } = req.body;
        const existing = await prisma_1.prisma.trainingStudent.findUnique({ where: { student_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Student not found' });
        const updated = await prisma_1.prisma.trainingStudent.update({
            where: { student_id: id },
            data: {
                student_name: student_name || existing.student_name,
                mobile: mobile !== undefined ? (mobile ? (0, auth_controller_1.cleanMobile)(mobile) : null) : existing.mobile,
                email: email !== undefined ? email : existing.email,
                course_enrolled: course_enrolled !== undefined ? course_enrolled : existing.course_enrolled,
                batch_name: batch_name !== undefined ? batch_name : existing.batch_name,
                enrollment_date: enrollment_date !== undefined ? (enrollment_date ? new Date(enrollment_date) : null) : existing.enrollment_date,
                total_fee: total_fee !== undefined ? Number(total_fee) : existing.total_fee,
                status: status || existing.status,
                notes: notes !== undefined ? notes : existing.notes
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'UPDATE', `Student: ${updated.student_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateStudent = updateStudent;
const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await prisma_1.prisma.trainingStudent.findUnique({ where: { student_id: id } });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        await prisma_1.prisma.trainingStudent.update({
            where: { student_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'DELETE', `Student: ${student.student_name}`);
        return res.status(200).json({ success: true, message: 'Student deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStudent = deleteStudent;
// ==========================================
// BATCHES SECTION
// ==========================================
const getBatches = async (req, res, next) => {
    try {
        const batches = await prisma_1.prisma.trainingBatch.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ success: true, data: batches });
    }
    catch (error) {
        next(error);
    }
};
exports.getBatches = getBatches;
const createBatch = async (req, res, next) => {
    try {
        const { batch_name, course_name, start_date, end_date, schedule_days, time_slot, capacity, teacher_name, status } = req.body;
        const batch = await prisma_1.prisma.trainingBatch.create({
            data: {
                batch_name,
                course_name,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                schedule_days: Array.isArray(schedule_days) ? schedule_days.join(',') : schedule_days,
                time_slot,
                capacity: Number(capacity || 0),
                teacher_name,
                status,
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'CREATE', `Batch: ${batch_name}`);
        return res.status(201).json({ success: true, data: batch });
    }
    catch (error) {
        next(error);
    }
};
exports.createBatch = createBatch;
const updateBatch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { batch_name, course_name, start_date, end_date, schedule_days, time_slot, capacity, teacher_name, status } = req.body;
        const existing = await prisma_1.prisma.trainingBatch.findUnique({ where: { batch_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Batch not found' });
        const updated = await prisma_1.prisma.trainingBatch.update({
            where: { batch_id: id },
            data: {
                batch_name: batch_name || existing.batch_name,
                course_name: course_name !== undefined ? course_name : existing.course_name,
                start_date: start_date !== undefined ? (start_date ? new Date(start_date) : null) : existing.start_date,
                end_date: end_date !== undefined ? (end_date ? new Date(end_date) : null) : existing.end_date,
                schedule_days: schedule_days !== undefined ? (Array.isArray(schedule_days) ? schedule_days.join(',') : schedule_days) : existing.schedule_days,
                time_slot: time_slot !== undefined ? time_slot : existing.time_slot,
                capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
                teacher_name: teacher_name !== undefined ? teacher_name : existing.teacher_name,
                status: status || existing.status
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'UPDATE', `Batch: ${updated.batch_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBatch = updateBatch;
const deleteBatch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const batch = await prisma_1.prisma.trainingBatch.findUnique({ where: { batch_id: id } });
        if (!batch)
            return res.status(404).json({ success: false, message: 'Batch not found' });
        await prisma_1.prisma.trainingBatch.update({
            where: { batch_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'DELETE', `Batch: ${batch.batch_name}`);
        return res.status(200).json({ success: true, message: 'Batch deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBatch = deleteBatch;
// ==========================================
// STUDY LOGS SECTION
// ==========================================
const getStudyLogs = async (req, res, next) => {
    try {
        const logs = await prisma_1.prisma.trainingStudyLog.findMany({
            where: { deleted_at: null },
            orderBy: { log_date: 'desc' }
        });
        return res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudyLogs = getStudyLogs;
const createStudyLog = async (req, res, next) => {
    try {
        const { log_date, course_name, hours_studied, topics_covered } = req.body;
        const log = await prisma_1.prisma.trainingStudyLog.create({
            data: {
                log_date: log_date ? new Date(log_date) : null,
                course_name,
                hours_studied: Number(hours_studied || 0),
                topics_covered,
                created_by: req.user?.userId || 'system'
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'CREATE', `Study Log: ${course_name} (${hours_studied} hrs)`);
        return res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        next(error);
    }
};
exports.createStudyLog = createStudyLog;
const updateStudyLog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { log_date, course_name, hours_studied, topics_covered } = req.body;
        const existing = await prisma_1.prisma.trainingStudyLog.findUnique({ where: { log_id: id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Study log not found' });
        const updated = await prisma_1.prisma.trainingStudyLog.update({
            where: { log_id: id },
            data: {
                log_date: log_date !== undefined ? (log_date ? new Date(log_date) : null) : existing.log_date,
                course_name: course_name || existing.course_name,
                hours_studied: hours_studied !== undefined ? Number(hours_studied) : existing.hours_studied,
                topics_covered: topics_covered !== undefined ? topics_covered : existing.topics_covered
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'UPDATE', `Study Log: ${updated.course_name}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateStudyLog = updateStudyLog;
const deleteStudyLog = async (req, res, next) => {
    try {
        const { id } = req.params;
        const log = await prisma_1.prisma.trainingStudyLog.findUnique({ where: { log_id: id } });
        if (!log)
            return res.status(404).json({ success: false, message: 'Study log not found' });
        await prisma_1.prisma.trainingStudyLog.update({
            where: { log_id: id },
            data: { deleted_at: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'DELETE', `Study Log: ${log.course_name}`);
        return res.status(200).json({ success: true, message: 'Study log deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStudyLog = deleteStudyLog;
// ==========================================
// TECH TRAINING ANALYTICS & SKILLS CLOUD
// ==========================================
const getTrainingAnalytics = async (req, res, next) => {
    try {
        const courses = await prisma_1.prisma.trainingCourse.findMany({ where: { deleted_at: null } });
        const students = await prisma_1.prisma.trainingStudent.findMany({ where: { deleted_at: null } });
        const batches = await prisma_1.prisma.trainingBatch.findMany({ where: { deleted_at: null } });
        const studyLogs = await prisma_1.prisma.trainingStudyLog.findMany({ where: { deleted_at: null } });
        // 1. Dynamic Skills Cloud
        const tagCount = {};
        courses.forEach(c => {
            if (c.skill_tags) {
                c.skill_tags.split(',').forEach(tag => {
                    const trimmed = tag.trim();
                    if (trimmed) {
                        tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
                    }
                });
            }
        });
        const skillsCloud = Object.entries(tagCount).map(([name, count]) => ({
            name,
            value: count, // Count determines visual tag sizing
        }));
        // 2. Fee analytics (Expected vs Collected)
        let totalExpected = 0;
        // We will calculate paid from installments
        const fees = await prisma_1.prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null } });
        let totalCollected = 0;
        let totalPending = 0;
        const courseRevenue = {};
        const batchRevenue = {};
        students.forEach(s => {
            const sFees = fees.filter(f => f.student_id === s.student_id && f.status === 'Paid');
            const paid = sFees.reduce((sum, f) => sum + Number(f.amount), 0);
            const expected = Number(s.total_fee || 0);
            totalExpected += expected;
            totalCollected += paid;
            totalPending += Math.max(0, expected - paid);
            if (s.course_enrolled) {
                courseRevenue[s.course_enrolled] = (courseRevenue[s.course_enrolled] || 0) + paid;
            }
            if (s.batch_name) {
                batchRevenue[s.batch_name] = (batchRevenue[s.batch_name] || 0) + paid;
            }
        });
        // Course wise breakdown
        const courseBreakdown = Object.entries(courseRevenue).map(([name, value]) => ({ name, value }));
        // Batch wise breakdown
        const batchBreakdown = Object.entries(batchRevenue).map(([name, value]) => ({ name, value }));
        // Student statuses donut
        const activeCount = students.filter(s => s.status === 'Active').length;
        const completedCount = students.filter(s => s.status === 'Completed').length;
        const droppedCount = students.filter(s => s.status === 'Dropped').length;
        const studentStatuses = [
            { name: 'Active', value: activeCount },
            { name: 'Completed', value: completedCount },
            { name: 'Dropped', value: droppedCount }
        ];
        // Weekly study hours calculation
        // Calculate total study hours in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyLogs = studyLogs.filter(log => log.log_date && new Date(log.log_date) >= sevenDaysAgo);
        const weeklyStudyHours = weeklyLogs.reduce((sum, log) => sum + Number(log.hours_studied), 0);
        // Monthly enrollments (12 months trend)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const allFees = await prisma_1.prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null } });
        const monthlyTrend = months.map((m, idx) => {
            const monthFees = allFees.filter(f => {
                if (!f.date || f.status !== 'Paid')
                    return false;
                const dt = new Date(f.date);
                return dt.getMonth() === idx && dt.getFullYear() === currentYear;
            });
            const monthStudents = students.filter(s => {
                if (!s.enrollment_date)
                    return false;
                const d = new Date(s.enrollment_date);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            });
            return {
                name: m,
                enrollments: monthStudents.length,
                feesCollected: monthFees.reduce((sum, f) => sum + Number(f.amount), 0)
            };
        });
        // Pinned courses list
        const pinnedCourses = courses.filter(c => c.is_pinned);
        return res.status(200).json({
            success: true,
            analytics: {
                totalExpected,
                totalCollected,
                totalPending,
                weeklyStudyHours,
                skillsCloud,
                courseBreakdown,
                batchBreakdown,
                studentStatuses,
                monthlyTrend,
                pinnedCourses
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrainingAnalytics = getTrainingAnalytics;
// --- Training Fee Installments ---
const getTrainingFeeInstallments = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrainingFeeInstallments = getTrainingFeeInstallments;
const createTrainingFeeInstallment = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.trainingFeeInstallment.create({
            data: {
                ...req.body,
                date: req.body.date ? new Date(req.body.date) : new Date(),
                amount: Number(req.body.amount || 0),
                created_by: req.user?.userId || 'unknown'
            }
        });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createTrainingFeeInstallment = createTrainingFeeInstallment;
const updateTrainingFeeInstallment = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.trainingFeeInstallment.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                ...(req.body.date ? { date: new Date(req.body.date) } : {}),
                ...(req.body.amount ? { amount: Number(req.body.amount) } : {})
            }
        });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTrainingFeeInstallment = updateTrainingFeeInstallment;
const deleteTrainingFeeInstallment = async (req, res, next) => {
    try {
        await prisma_1.prisma.trainingFeeInstallment.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTrainingFeeInstallment = deleteTrainingFeeInstallment;
// ==========================================
// ATTENDANCE
// ==========================================
const getTrainingAttendance = async (req, res, next) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        const queryDate = date ? new Date(date) : new Date();
        // find all active students
        const students = await prisma_1.prisma.trainingStudent.findMany({
            where: { status: 'Active', deleted_at: null },
            select: { student_id: true, student_name: true, batch_name: true }
        });
        const records = await prisma_1.prisma.trainingAttendance.findMany({
            where: { date: queryDate, deleted_at: null }
        });
        const attendanceList = students.map(s => {
            const rec = records.find(r => r.student_id === s.student_id);
            return {
                student_id: s.student_id,
                student_name: s.student_name,
                batch_name: s.batch_name,
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
exports.getTrainingAttendance = getTrainingAttendance;
const markTrainingAttendance = async (req, res, next) => {
    try {
        const { date, records } = req.body;
        // records: [{ student_id, status, notes }]
        const queryDate = new Date(date);
        for (const r of records) {
            if (r.status === 'Not Marked')
                continue;
            const existing = await prisma_1.prisma.trainingAttendance.findFirst({
                where: { student_id: r.student_id, date: queryDate }
            });
            if (existing) {
                await prisma_1.prisma.trainingAttendance.update({
                    where: { id: existing.id },
                    data: { status: r.status, notes: r.notes }
                });
            }
            else {
                await prisma_1.prisma.trainingAttendance.create({
                    data: {
                        student_id: r.student_id,
                        date: queryDate,
                        status: r.status,
                        notes: r.notes
                    }
                });
            }
        }
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', 'RturoxAcademy', 'UPDATE', `Marked attendance for ${date}`);
        return res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.markTrainingAttendance = markTrainingAttendance;
