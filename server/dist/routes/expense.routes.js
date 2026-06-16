"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const expense_controller_1 = require("../controllers/expense.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// All expense routes require authentication
router.use(auth_1.requireAuth);
// --- List expenses (filtered by query params) ---
router.get('/', expense_controller_1.getExpenses);
// --- Admin-only: aggregated summary across all businesses ---
router.get('/summary/all', auth_1.requireAdmin, expense_controller_1.getExpenseSummary);
// --- Get single expense ---
router.get('/:id', expense_controller_1.getExpenseById);
// --- Create expense ---
router.post('/', [
    (0, express_validator_1.body)('business_slug')
        .isIn(['tech', 'realestate', 'training', 'coaching'])
        .withMessage('Business slug must be one of: tech, realestate, training, coaching'),
    (0, express_validator_1.body)('category')
        .trim()
        .notEmpty()
        .withMessage('Expense category is required'),
    (0, express_validator_1.body)('amount')
        .isNumeric()
        .withMessage('Amount must be a number'),
    (0, express_validator_1.body)('date')
        .notEmpty()
        .withMessage('Expense date is required'),
    validate_1.validate
], expense_controller_1.createExpense);
// --- Update expense ---
router.put('/:id', expense_controller_1.updateExpense);
// --- Delete expense (soft) ---
router.delete('/:id', expense_controller_1.deleteExpense);
exports.default = router;
