import { Router } from 'express';
import { body } from 'express-validator';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from '../controllers/expense.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// --- List expenses (filtered by query params) ---
router.get('/', getExpenses);

// --- Admin-only: aggregated summary across all businesses ---
router.get('/summary/all', requireAdmin, getExpenseSummary);

// --- Get single expense ---
router.get('/:id', getExpenseById);

// --- Create expense ---
router.post(
  '/',
  [
    body('business_slug')
      .isIn(['tech', 'realestate', 'training', 'coaching'])
      .withMessage('Business slug must be one of: tech, realestate, training, coaching'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Expense category is required'),
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number'),
    body('date')
      .notEmpty()
      .withMessage('Expense date is required'),
    validate
  ],
  createExpense
);

// --- Update expense ---
router.put('/:id', updateExpense);

// --- Delete expense (soft) ---
router.delete('/:id', deleteExpense);

export default router;
