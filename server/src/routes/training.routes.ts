import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getStudyLogs,
  createStudyLog,
  updateStudyLog,
  deleteStudyLog,

  getTrainingFeeInstallments,
  createTrainingFeeInstallment,
  updateTrainingFeeInstallment,
  deleteTrainingFeeInstallment,
  getTrainingAnalytics,
  getTrainingAttendance,
  markTrainingAttendance
} from '../controllers/training.controller';

import { requireAuth, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);
router.use(requireBusiness(['training']));

// --- Courses ---
router.get('/courses', getCourses);
router.post(
  '/courses',
  [
    body('course_name').trim().notEmpty().withMessage('Course name is required'),
    body('platform').isIn(['College', 'Online', 'YouTube', 'Udemy', 'Coursera', 'Rturox', 'Other']),
    body('category').isIn(['Web Dev', 'Mobile', 'AI/ML', 'Design', 'Marketing', 'DevOps', 'Other']),
    body('status').isIn(['Not Started', 'In Progress', 'Completed']),
    body('total_modules').isInt({ min: 1 }).withMessage('Total modules must be at least 1'),
    body('completed_modules').isInt({ min: 0 }).withMessage('Completed modules must be 0 or positive'),
    body('certificate_status').isIn(['Not Applicable', 'Pending', 'Uploaded']),
    validate
  ],
  createCourse
);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// --- Students ---
router.get('/students', getStudents);
router.post(
  '/students',
  [
    body('student_name').trim().notEmpty().withMessage('Student name is required'),
    body('total_fee').isNumeric().withMessage('Total fee must be a number'),
    body('amount_paid').isNumeric().withMessage('Amount paid must be a number'),
    body('status').isIn(['Active', 'Completed', 'Dropped']),
    validate
  ],
  createStudent
);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// --- Batches ---
router.get('/batches', getBatches);
router.post(
  '/batches',
  [
    body('batch_name').trim().notEmpty().withMessage('Batch name is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('status').isIn(['Upcoming', 'Active', 'Completed']),
    validate
  ],
  createBatch
);
router.put('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);

// --- Study Logs ---
router.get('/studylogs', getStudyLogs);
router.post(
  '/studylogs',
  [
    body('course_name').trim().notEmpty().withMessage('Course name is required'),
    body('hours_studied').isNumeric().withMessage('Hours studied must be a number'),
    validate
  ],
  createStudyLog
);
router.put('/studylogs/:id', updateStudyLog);
router.delete('/studylogs/:id', deleteStudyLog);


// --- Training Fee Installments ---
router.get('/fees', getTrainingFeeInstallments);
router.post('/fees', createTrainingFeeInstallment);
router.put('/fees/:id', updateTrainingFeeInstallment);
router.delete('/fees/:id', deleteTrainingFeeInstallment);


// --- Attendance ---
router.get('/attendance', getTrainingAttendance);
router.post('/attendance', markTrainingAttendance);

// --- Analytics ---


router.get('/analytics', getTrainingAnalytics);

export default router;
