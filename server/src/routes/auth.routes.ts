import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, refresh, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/login',
  [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('passcode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Passcode must be a 6-digit PIN'),
    validate
  ],
  login
);

router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', requireAuth, me);

export default router;
