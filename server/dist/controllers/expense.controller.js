"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenseSummary = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenseById = exports.getExpenses = void 0;
const prisma_1 = require("../prisma");
const activityLogger_1 = require("../utils/activityLogger");
// Business slug → display name mapping for activity logs
const BUSINESS_LABELS = {
    tech: 'Rturox Technology',
    realestate: 'DkProperties',
    training: 'RturoxAcademy',
    coaching: 'AchieversNest'
};
const VALID_SLUGS = ['tech', 'realestate', 'training', 'coaching'];
// ==========================================
// GET ALL EXPENSES (filtered by slug, optional month)
// ==========================================
const getExpenses = async (req, res, next) => {
    try {
        const { slug, month, category } = req.query;
        // Build where clause
        const where = { deleted_at: null };
        // Non-admin users can only see their own business expenses
        if (req.user?.role !== 'ADMIN') {
            where.business_slug = req.user?.businessSlug;
        }
        else if (slug && typeof slug === 'string') {
            where.business_slug = slug;
        }
        // Optional month filter (format: "2026-05")
        if (month && typeof month === 'string') {
            const [year, mon] = month.split('-').map(Number);
            if (year && mon) {
                const startDate = new Date(year, mon - 1, 1);
                const endDate = new Date(year, mon, 1);
                where.date = {
                    gte: startDate,
                    lt: endDate
                };
            }
        }
        // Optional category filter
        if (category && typeof category === 'string') {
            where.category = category;
        }
        const expenses = await prisma_1.prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        return res.status(200).json({ success: true, data: expenses });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenses = getExpenses;
// ==========================================
// GET SINGLE EXPENSE BY ID
// ==========================================
const getExpenseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const expense = await prisma_1.prisma.expense.findUnique({ where: { id } });
        if (!expense || expense.deleted_at) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        // Non-admin users can only view their own business's expenses
        if (req.user?.role !== 'ADMIN' && expense.business_slug !== req.user?.businessSlug) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        return res.status(200).json({ success: true, data: expense });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenseById = getExpenseById;
// ==========================================
// CREATE EXPENSE
// ==========================================
const createExpense = async (req, res, next) => {
    try {
        const { business_slug, category, amount, description, date, payment_mode, notes } = req.body;
        // Non-admin users can only add expenses for their own business
        if (req.user?.role !== 'ADMIN' && business_slug !== req.user?.businessSlug) {
            return res.status(403).json({ success: false, message: 'You can only add expenses for your own business.' });
        }
        const expense = await prisma_1.prisma.expense.create({
            data: {
                business_slug,
                category,
                amount: Number(amount || 0),
                description: description || null,
                date: new Date(date),
                payment_mode: payment_mode || null,
                notes: notes || null,
                created_by: req.user?.userId || 'system'
            }
        });
        const bizLabel = BUSINESS_LABELS[business_slug] || business_slug;
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', bizLabel, 'CREATE', `Expense: ₹${amount} — ${category}`);
        return res.status(201).json({ success: true, data: expense });
    }
    catch (error) {
        next(error);
    }
};
exports.createExpense = createExpense;
// ==========================================
// UPDATE EXPENSE
// ==========================================
const updateExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { business_slug, category, amount, description, date, payment_mode, notes } = req.body;
        const existing = await prisma_1.prisma.expense.findUnique({ where: { id } });
        if (!existing || existing.deleted_at) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        // Non-admin users can only edit their own business's expenses
        if (req.user?.role !== 'ADMIN' && existing.business_slug !== req.user?.businessSlug) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const updated = await prisma_1.prisma.expense.update({
            where: { id },
            data: {
                business_slug: business_slug !== undefined ? business_slug : existing.business_slug,
                category: category !== undefined ? category : existing.category,
                amount: amount !== undefined ? Number(amount) : existing.amount,
                description: description !== undefined ? description : existing.description,
                date: date !== undefined ? new Date(date) : existing.date,
                payment_mode: payment_mode !== undefined ? payment_mode : existing.payment_mode,
                notes: notes !== undefined ? notes : existing.notes
            }
        });
        const bizLabel = BUSINESS_LABELS[updated.business_slug] || updated.business_slug;
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', bizLabel, 'UPDATE', `Expense: ₹${updated.amount} — ${updated.category}`);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExpense = updateExpense;
// ==========================================
// DELETE EXPENSE (soft delete)
// ==========================================
const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const expense = await prisma_1.prisma.expense.findUnique({ where: { id } });
        if (!expense || expense.deleted_at) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        // Non-admin users can only delete their own business's expenses
        if (req.user?.role !== 'ADMIN' && expense.business_slug !== req.user?.businessSlug) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        await prisma_1.prisma.expense.update({
            where: { id },
            data: { deleted_at: new Date() }
        });
        const bizLabel = BUSINESS_LABELS[expense.business_slug] || expense.business_slug;
        await (0, activityLogger_1.logActivity)(req.user?.userId || 'system', bizLabel, 'DELETE', `Expense: ₹${expense.amount} — ${expense.category}`);
        return res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExpense = deleteExpense;
// ==========================================
// ADMIN: EXPENSE SUMMARY (all businesses)
// ==========================================
const getExpenseSummary = async (req, res, next) => {
    try {
        const { month } = req.query;
        const where = { deleted_at: null };
        // Optional month filter
        if (month && typeof month === 'string') {
            const [year, mon] = month.split('-').map(Number);
            if (year && mon) {
                const startDate = new Date(year, mon - 1, 1);
                const endDate = new Date(year, mon, 1);
                where.date = { gte: startDate, lt: endDate };
            }
        }
        const expenses = await prisma_1.prisma.expense.findMany({ where });
        // Per-business totals
        const businessTotals = {};
        VALID_SLUGS.forEach(s => { businessTotals[s] = 0; });
        // Per-category totals
        const categoryTotals = {};
        // Monthly trend (current year)
        const currentYear = new Date().getFullYear();
        const monthlyTrend = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthNames.forEach(m => {
            monthlyTrend[m] = {};
            VALID_SLUGS.forEach(s => { monthlyTrend[m][s] = 0; });
        });
        let grandTotal = 0;
        expenses.forEach(exp => {
            const amt = Number(exp.amount || 0);
            grandTotal += amt;
            // Business totals
            if (businessTotals[exp.business_slug] !== undefined) {
                businessTotals[exp.business_slug] += amt;
            }
            // Category totals
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
            // Monthly trend
            const d = new Date(exp.date);
            if (d.getFullYear() === currentYear) {
                const mName = monthNames[d.getMonth()];
                if (monthlyTrend[mName] && monthlyTrend[mName][exp.business_slug] !== undefined) {
                    monthlyTrend[mName][exp.business_slug] += amt;
                }
            }
        });
        // Format category breakdown for pie chart
        const categoryBreakdown = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        // Format monthly trend for bar chart
        const monthlyData = monthNames.map(m => ({
            name: m,
            'Rturox Technology': monthlyTrend[m].tech || 0,
            'DkProperties': monthlyTrend[m].realestate || 0,
            'RturoxAcademy': monthlyTrend[m].training || 0,
            'AchieversNest': monthlyTrend[m].coaching || 0
        }));
        return res.status(200).json({
            success: true,
            data: {
                grandTotal,
                businessTotals,
                categoryBreakdown,
                monthlyData
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenseSummary = getExpenseSummary;
