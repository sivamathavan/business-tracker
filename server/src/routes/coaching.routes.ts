import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCoachingStudents,
  createCoachingStudent,
  updateCoachingStudent,
  deleteCoachingStudent,
  getStudentFees,
  upsertFeeRecord,
  getMonthlyCollection,
  getOverdueFeesList,
  getExams,
  createExam,
  getExamMarksheet,
  saveBulkExamResults,
  getStudentReportCardData,
  getCoachingStaff,
  createCoachingStaff,
  updateCoachingStaff,
  deleteCoachingStaff,
  getCoachingBatches,
  createCoachingBatch,
  updateCoachingBatch,
  deleteCoachingBatch,
  getCoachingAnalytics,
  autoGenerateMonthlyFees,
  getCoachingAttendance,
  markCoachingAttendance
} from '../controllers/coaching.controller';
import { requireAuth, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);
router.use(requireBusiness(['coaching']));

// --- Students ---
router.get('/students', getCoachingStudents);
router.post(
  '/students',
  [
    body('student_name').trim().notEmpty().withMessage('Student name is required'),
    body('parent_mobile').trim().notEmpty().withMessage('Parent mobile is required'),
    body('standard').trim().notEmpty().withMessage('Standard standard is required'),
    body('monthly_fee').isNumeric().withMessage('Monthly fee must be a number'),
    body('status').isIn(['Active', 'Inactive', 'Completed']),
    validate
  ],
  createCoachingStudent
);
router.put('/students/:id', updateCoachingStudent);
router.delete('/students/:id', deleteCoachingStudent);

// --- Fees Management ---
router.get('/fees/student/:studentId', getStudentFees);
router.post(
  '/fees',
  [
    body('student_id').trim().notEmpty().withMessage('Student ID is required'),
    body('month_year').trim().notEmpty().withMessage('Month-Year is required (e.g. June 2026)'),
    body('fee_amount').isNumeric().withMessage('Fee amount must be a number'),
    body('status').isIn(['Paid', 'Pending', 'Overdue']),
    validate
  ],
  upsertFeeRecord
);
router.get('/fees/monthly', getMonthlyCollection);
router.get('/fees/overdue', getOverdueFeesList);

// --- Exams & Marksheet entry ---
router.get('/exams', getExams);
router.post(
  '/exams',
  [
    body('exam_name').trim().notEmpty().withMessage('Exam name is required'),
    body('standard').trim().notEmpty().withMessage('Standard standard is required'),
    body('total_marks').isInt({ min: 10 }).withMessage('Total marks must be at least 10'),
    validate
  ],
  createExam
);
router.get('/exams/:examId/marksheet', getExamMarksheet);
router.post('/exams/:examId/marksheet', saveBulkExamResults);
router.get('/students/:studentId/report-card', getStudentReportCardData);

// --- Staff Management ---
router.get('/staff', getCoachingStaff);
router.post(
  '/staff',
  [
    body('staff_name').trim().notEmpty().withMessage('Staff name is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    body('monthly_salary').isNumeric().withMessage('Monthly salary must be a number'),
    body('status').isIn(['Active', 'Inactive']),
    validate
  ],
  createCoachingStaff
);
router.put('/staff/:id', updateCoachingStaff);
router.delete('/staff/:id', deleteCoachingStaff);

// --- Batches ---
router.get('/batches', getCoachingBatches);
router.post(
  '/batches',
  [
    body('batch_name').trim().notEmpty().withMessage('Batch name is required'),
    body('standard').trim().notEmpty().withMessage('Standard is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('status').isIn(['Active', 'Holiday', 'Completed']),
    validate
  ],
  createCoachingBatch
);
router.put('/batches/:id', updateCoachingBatch);
router.delete('/batches/:id', deleteCoachingBatch);


// --- Fee Auto Generation ---
router.post('/fees/auto-generate', autoGenerateMonthlyFees);


// --- Attendance ---
router.get('/attendance', getCoachingAttendance);
router.post('/attendance', markCoachingAttendance);

// --- Analytics ---


router.get('/analytics', getCoachingAnalytics);

export default router;
