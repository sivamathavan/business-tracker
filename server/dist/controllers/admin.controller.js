"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = exports.getConsolidatedRevenueTrend = exports.getActivityLogs = exports.resetBusinessData = exports.toggleBusinessStatus = exports.deleteUser = exports.changeUserPasscode = exports.createUser = exports.getUsers = exports.getAdminOverview = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const prisma_1 = require("../prisma");
const activityLogger_1 = require("../utils/activityLogger");
// ==========================================
// ADMIN GLOBAL OVERVIEW
// ==========================================
const getAdminOverview = async (req, res, next) => {
    try {
        // 1. Get all businesses
        const businesses = await prisma_1.prisma.business.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
        // 2. Fetch all data — using IDENTICAL logic as each individual portal's analytics
        const techProjects = await prisma_1.prisma.techProject.findMany({ where: { deleted_at: null } });
        const reDeals = await prisma_1.prisma.reDeal.findMany({ where: { deleted_at: null } });
        const reCommissions = await prisma_1.prisma.reCommissionRecord.findMany({ where: { deleted_at: null } });
        const trainingStudents = await prisma_1.prisma.trainingStudent.findMany({ where: { deleted_at: null } });
        const trainingFees = await prisma_1.prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null } });
        const coachingFeeRecords = await prisma_1.prisma.coachingFeeRecord.findMany({ where: { deleted_at: null } });
        // --- Tech Calculations (mirrors tech.controller getTechAnalytics) ---
        // Collected = sum(amount_received) across all projects
        // Pending   = sum(total_amount - amount_received) for each project (floored at 0)
        let techCollected = 0;
        let techPending = 0;
        techProjects.forEach(p => {
            techCollected += Number(p.amount_received || 0);
            techPending += Math.max(0, Number(p.total_amount || 0) - Number(p.amount_received || 0));
        });
        // --- Real Estate Calculations (mirrors re.controller getReAnalytics) ---
        let reCollected = 0;
        let rePending = 0;
        reCommissions.forEach(c => {
            reCollected += Number(c.commission_received || 0);
            rePending += Math.max(0, Number(c.commission_expected || 0) - Number(c.commission_received || 0));
        });
        reDeals.forEach(d => {
            reCollected += Number(d.commission_received || 0);
            rePending += Math.max(0, Number(d.commission_amount || 0) - Number(d.commission_received || 0));
        });
        // --- Training Calculations (mirrors training.controller getTrainingAnalytics) ---
        // Collected = sum of amount in Paid installments
        // Pending   = total_fee - total collected (floored at 0)
        let trainingCollected = 0;
        trainingFees.forEach(f => {
            if (f.status === 'Paid')
                trainingCollected += Number(f.amount || 0);
        });
        let trainingPending = 0;
        trainingStudents.forEach(s => {
            const studentFees = trainingFees.filter(f => f.student_id === s.student_id && f.status === 'Paid');
            const studentCollected = studentFees.reduce((sum, f) => sum + Number(f.amount), 0);
            trainingPending += Math.max(0, Number(s.total_fee || 0) - studentCollected);
        });
        // --- Coaching Calculations (mirrors coaching.controller getCoachingAnalytics) ---
        // Collected = sum of fee_amount on Paid records
        // Pending   = sum of fee_amount on Pending + Overdue records
        const coachingFeesPaid = coachingFeeRecords.filter(f => f.status === 'Paid');
        const coachingFeesUnpaid = coachingFeeRecords.filter(f => f.status === 'Pending' || f.status === 'Overdue');
        const coachingCollected = coachingFeesPaid.reduce((sum, f) => sum + Number(f.fee_amount), 0);
        const coachingPending = coachingFeesUnpaid.reduce((sum, f) => sum + Number(f.fee_amount), 0);
        const coachingActiveCount = await prisma_1.prisma.coachingStudent.count({
            where: { status: 'Active', deleted_at: null }
        });
        // Consolidated Metrics
        const grandTotalRevenue = techCollected + reCollected + trainingCollected + coachingCollected;
        const grandTotalPending = techPending + rePending + trainingPending + coachingPending;
        // Tile statistics per business
        const businessTiles = businesses.map(b => {
            let revenue = 0;
            let pending = 0;
            let keyCount = 0;
            let label = 'Records';
            if (b.slug === 'tech') {
                revenue = techCollected;
                pending = techPending;
                keyCount = techProjects.length;
                label = 'Projects';
            }
            else if (b.slug === 'realestate') {
                revenue = reCollected;
                pending = rePending;
                keyCount = reDeals.length;
                label = 'Deals';
            }
            else if (b.slug === 'training') {
                revenue = trainingCollected;
                pending = trainingPending;
                keyCount = trainingStudents.length;
                label = 'Students';
            }
            else if (b.slug === 'coaching') {
                revenue = coachingCollected;
                pending = coachingPending;
                keyCount = coachingActiveCount;
                label = 'Students';
            }
            return {
                id: b.id,
                name: b.name,
                slug: b.slug,
                isActive: b.isActive,
                revenue,
                pending,
                keyCount,
                label
            };
        });
        return res.status(200).json({
            success: true,
            data: {
                grandTotalRevenue,
                grandTotalPending,
                businessTiles
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminOverview = getAdminOverview;
// ==========================================
// USER ACCESS MANAGEMENT
// ==========================================
const getUsers = async (req, res, next) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            where: { deletedAt: null },
            include: { business: true },
            orderBy: { role: 'asc' }
        });
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            userId: u.userId,
            role: u.role,
            businessId: u.businessId,
            businessName: u.business?.name || 'All Businesses (Admin)',
            businessSlug: u.business?.slug || 'admin',
            createdAt: u.createdAt
        }));
        return res.status(200).json({ success: true, data: sanitizedUsers });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res, next) => {
    try {
        const { userId, passcode, businessId, role } = req.body;
        const existing = await prisma_1.prisma.user.findFirst({ where: { userId, deletedAt: null } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User ID already exists.' });
        }
        const salt = bcrypt.genSaltSync(10);
        const passcodeHash = bcrypt.hashSync(passcode, salt);
        const user = await prisma_1.prisma.user.create({
            data: {
                userId,
                passcodeHash,
                role: role || 'USER',
                businessId: businessId || null
            }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'admin', 'Admin Panel', 'CREATE', `User Account: ${userId}`);
        return res.status(201).json({
            success: true,
            message: 'User account created successfully.',
            data: { id: user.id, userId: user.userId, role: user.role }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const changeUserPasscode = async (req, res, next) => {
    try {
        const { userId, newPasscode } = req.body;
        const user = await prisma_1.prisma.user.findFirst({ where: { userId, deletedAt: null } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const salt = bcrypt.genSaltSync(10);
        const passcodeHash = bcrypt.hashSync(newPasscode, salt);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { passcodeHash }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'admin', 'Admin Panel', 'UPDATE', `Changed passcode for user: ${userId}`);
        return res.status(200).json({ success: true, message: `Passcode for "${userId}" successfully modified.` });
    }
    catch (error) {
        next(error);
    }
};
exports.changeUserPasscode = changeUserPasscode;
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        if (user.userId === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot delete the master admin account.' });
        }
        await prisma_1.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'admin', 'Admin Panel', 'DELETE', `User Account: ${user.userId}`);
        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
// ==========================================
// BUSINESS TOGGLE & DATA CLEAR
// ==========================================
const toggleBusinessStatus = async (req, res, next) => {
    try {
        const { businessId, isActive } = req.body;
        const updated = await prisma_1.prisma.business.update({
            where: { id: businessId },
            data: { isActive }
        });
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'admin', 'Admin Panel', 'UPDATE', `Toggled business "${updated.name}" to ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        return res.status(200).json({
            success: true,
            message: `Business "${updated.name}" is now ${isActive ? 'active' : 'deactivated'}.`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleBusinessStatus = toggleBusinessStatus;
const resetBusinessData = async (req, res, next) => {
    try {
        const { slug } = req.body;
        if (slug === 'tech') {
            await prisma_1.prisma.techProject.deleteMany({});
            await prisma_1.prisma.techInvoice.deleteMany({});
            await prisma_1.prisma.techProposal.deleteMany({});
        }
        else if (slug === 'realestate') {
            await prisma_1.prisma.reActivity.deleteMany({});
            await prisma_1.prisma.rePeoplePayment.deleteMany({});
            await prisma_1.prisma.rePayout.deleteMany({});
            await prisma_1.prisma.reCommissionRecord.deleteMany({});
            await prisma_1.prisma.reProperty.deleteMany({});
            await prisma_1.prisma.reDeal.deleteMany({});
            await prisma_1.prisma.rePerson.deleteMany({});
        }
        else if (slug === 'training') {
            await prisma_1.prisma.trainingCourse.deleteMany({});
            await prisma_1.prisma.trainingStudent.deleteMany({});
            await prisma_1.prisma.trainingBatch.deleteMany({});
            await prisma_1.prisma.trainingStudyLog.deleteMany({});
        }
        else if (slug === 'coaching') {
            await prisma_1.prisma.coachingResult.deleteMany({});
            await prisma_1.prisma.coachingExam.deleteMany({});
            await prisma_1.prisma.coachingStaff.deleteMany({});
            await prisma_1.prisma.coachingBatch.deleteMany({});
            await prisma_1.prisma.coachingFeeRecord.deleteMany({});
            await prisma_1.prisma.coachingStudent.deleteMany({});
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid business slug.' });
        }
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'admin', 'Admin Panel', 'DELETE', `RESET business database for slug: ${slug}`);
        return res.status(200).json({
            success: true,
            message: `All database items belonging to the "${slug}" pipeline have been cleared.`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetBusinessData = resetBusinessData;
// ==========================================
// ACTIVITY LOG & CONSOLIDATED REVENUE
// ==========================================
const getActivityLogs = async (req, res, next) => {
    try {
        const logs = await prisma_1.prisma.activityLog.findMany({
            take: 50,
            orderBy: { timestamp: 'desc' }
        });
        return res.status(200).json({ success: true, data: logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getActivityLogs = getActivityLogs;
const getConsolidatedRevenueTrend = async (req, res, next) => {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        // Fetch data — using SAME sources as individual portals
        // Tech: uses project amount_received grouped by project creation month (NOT invoices)
        // RE: uses closed deal commissions grouped by deal creation month
        // Training: uses amount_paid grouped by enrollment_date month
        // Coaching: uses paid fee records grouped by paid_date month
        const techProjects = await prisma_1.prisma.techProject.findMany({ where: { deleted_at: null } });
        const reCommissions = await prisma_1.prisma.reCommissionRecord.findMany({ where: { deleted_at: null } });
        const trainingStudents = await prisma_1.prisma.trainingStudent.findMany({ where: { deleted_at: null } });
        const trainingFees = await prisma_1.prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null } });
        const coachingFees = await prisma_1.prisma.coachingFeeRecord.findMany({ where: { status: 'Paid', deleted_at: null } });
        const consolidatedTrend = months.map((m, idx) => {
            // Tech: sum amount_received for projects created in this month
            const techVal = techProjects.filter(p => {
                if (!p.created_at)
                    return false;
                const d = new Date(p.created_at);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            }).reduce((sum, p) => sum + Number(p.amount_received || 0), 0);
            // Real estate: commission received in this month
            const reVal = reCommissions.filter(c => {
                if (!c.created_at)
                    return false;
                const dt = new Date(c.created_at);
                return dt.getMonth() === idx && dt.getFullYear() === currentYear;
            }).reduce((sum, c) => sum + Number(c.commission_received || 0), 0);
            // Training: amount in Paid installments during this month
            const trainingVal = trainingFees.filter(f => {
                if (!f.date || f.status !== 'Paid')
                    return false;
                const dt = new Date(f.date);
                return dt.getMonth() === idx && dt.getFullYear() === currentYear;
            }).reduce((sum, f) => sum + Number(f.amount || 0), 0);
            // Coaching: paid fee records grouped by paid_date
            const coachingVal = coachingFees.filter(f => {
                if (!f.paid_date)
                    return false;
                const dt = new Date(f.paid_date);
                return dt.getMonth() === idx && dt.getFullYear() === currentYear;
            }).reduce((sum, f) => sum + Number(f.fee_amount), 0);
            return {
                name: m,
                'Rturox Technology': techVal,
                'DreamKey Properties': reVal,
                'Rturox Tech Training': trainingVal,
                'Rturox Coaching Centre': coachingVal,
                total: techVal + reVal + trainingVal + coachingVal
            };
        });
        return res.status(200).json({
            success: true,
            data: consolidatedTrend
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getConsolidatedRevenueTrend = getConsolidatedRevenueTrend;
// ==========================================
// GLOBAL CROSS-BUSINESS SEARCH
// ==========================================
const globalSearch = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }
        const searchStr = query.toLowerCase();
        // Search Tech Projects (Clients)
        const techClients = await prisma_1.prisma.techProject.findMany({
            where: {
                deleted_at: null,
                OR: [
                    { client_name: { contains: searchStr, mode: 'insensitive' } },
                    { client_mobile: { contains: searchStr } }
                ]
            },
            select: { project_id: true, client_name: true, client_mobile: true, project_name: true, status: true, created_at: true }
        });
        // Search Real Estate (People)
        const rePeople = await prisma_1.prisma.rePerson.findMany({
            where: {
                deleted_at: null,
                OR: [
                    { name: { contains: searchStr, mode: 'insensitive' } },
                    { mobile: { contains: searchStr } }
                ]
            },
            select: { id: true, name: true, mobile: true, person_type: true, district: true, status: true, created_at: true }
        });
        // Search Training Students
        const trainingStudents = await prisma_1.prisma.trainingStudent.findMany({
            where: {
                deleted_at: null,
                OR: [
                    { student_name: { contains: searchStr, mode: 'insensitive' } },
                    { mobile: { contains: searchStr } }
                ]
            },
            select: { student_id: true, student_name: true, mobile: true, course_enrolled: true, batch_name: true, status: true, created_at: true }
        });
        // Search Coaching Students
        const coachingStudents = await prisma_1.prisma.coachingStudent.findMany({
            where: {
                deleted_at: null,
                OR: [
                    { student_name: { contains: searchStr, mode: 'insensitive' } },
                    { parent_mobile: { contains: searchStr } },
                    { student_mobile: { contains: searchStr } }
                ]
            },
            select: { student_id: true, student_name: true, parent_mobile: true, standard: true, school_name: true, status: true, created_at: true }
        });
        // Normalize and aggregate results
        const results = [
            ...techClients.map(c => ({
                id: c.project_id,
                name: c.client_name,
                mobile: c.client_mobile,
                business: 'Rturox Tech Services',
                context: `Project: ${c.project_name} (${c.status})`,
                timestamp: c.created_at
            })),
            ...rePeople.map(p => ({
                id: p.id,
                name: p.name,
                mobile: p.mobile,
                business: 'DreamKey Real Estate',
                context: `${p.person_type} - ${p.district} (${p.status})`,
                timestamp: p.created_at
            })),
            ...trainingStudents.map(s => ({
                id: s.student_id,
                name: s.student_name,
                mobile: s.mobile,
                business: 'Rturox Training',
                context: `Course: ${s.course_enrolled} | Batch: ${s.batch_name} (${s.status})`,
                timestamp: s.created_at
            })),
            ...coachingStudents.map(s => ({
                id: s.student_id,
                name: s.student_name,
                mobile: s.parent_mobile,
                business: 'Rturox Coaching',
                context: `Standard: ${s.standard} - ${s.school_name} (${s.status})`,
                timestamp: s.created_at
            }))
        ];
        // Sort by most recent
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
};
exports.globalSearch = globalSearch;
