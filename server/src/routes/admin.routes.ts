import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminOverview,
  getUsers,
  createUser,
  changeUserPasscode,
  deleteUser,
  toggleBusinessStatus,
  resetBusinessData,
  getActivityLogs,
  getConsolidatedRevenueTrend
} from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Apply global admin authentication gates
router.use(requireAuth);
router.use(requireAdmin);

// --- Overview Dashboard stats ---
router.get('/overview', getAdminOverview);

// --- User Profiles Management ---
router.get('/users', getUsers);
router.post(
  '/users',
  [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('passcode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Passcode PIN must be exactly 6 digits'),
    body('role').isIn(['ADMIN', 'USER']),
    validate
  ],
  createUser
);
router.post(
  '/users/passcode',
  [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('newPasscode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('New passcode must be a 6-digit PIN'),
    validate
  ],
  changeUserPasscode
);
router.delete('/users/:id', deleteUser);

// --- Business status controls ---
router.post(
  '/business/toggle',
  [
    body('businessId').trim().notEmpty().withMessage('Business ID is required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean flag'),
    validate
  ],
  toggleBusinessStatus
);

router.post(
  '/business/reset',
  [
    body('slug').isIn(['tech', 'realestate', 'training', 'coaching']).withMessage('A valid business slug is required'),
    validate
  ],
  resetBusinessData
);

// --- Global Activity Logs ---
router.get('/activity', getActivityLogs);

// --- Consolidated financials ---
router.get('/revenue', getConsolidatedRevenueTrend);


// --- User Management ---
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', changeUserPasscode);
router.delete('/users/:id', deleteUser);

export default router;

