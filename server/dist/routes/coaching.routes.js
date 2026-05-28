"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const coaching_controller_1 = require("../controllers/coaching.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireBusiness)(['coaching']));
// --- Students ---
router.get('/students', coaching_controller_1.getCoachingStudents);
router.post('/students', [
    (0, express_validator_1.body)('student_name').trim().notEmpty().withMessage('Student name is required'),
    (0, express_validator_1.body)('parent_mobile').trim().notEmpty().withMessage('Parent mobile is required'),
    (0, express_validator_1.body)('standard').trim().notEmpty().withMessage('Standard standard is required'),
    (0, express_validator_1.body)('monthly_fee').isNumeric().withMessage('Monthly fee must be a number'),
    (0, express_validator_1.body)('status').isIn(['Active', 'Inactive', 'Completed']),
    validate_1.validate
], coaching_controller_1.createCoachingStudent);
router.put('/students/:id', coaching_controller_1.updateCoachingStudent);
router.delete('/students/:id', coaching_controller_1.deleteCoachingStudent);
// --- Fees Management ---
router.get('/fees/student/:studentId', coaching_controller_1.getStudentFees);
router.post('/fees', [
    (0, express_validator_1.body)('student_id').trim().notEmpty().withMessage('Student ID is required'),
    (0, express_validator_1.body)('month_year').trim().notEmpty().withMessage('Month-Year is required (e.g. June 2026)'),
    (0, express_validator_1.body)('fee_amount').isNumeric().withMessage('Fee amount must be a number'),
    (0, express_validator_1.body)('status').isIn(['Paid', 'Pending', 'Overdue']),
    validate_1.validate
], coaching_controller_1.upsertFeeRecord);
router.get('/fees/monthly', coaching_controller_1.getMonthlyCollection);
router.get('/fees/overdue', coaching_controller_1.getOverdueFeesList);
// --- Exams & Marksheet entry ---
router.get('/exams', coaching_controller_1.getExams);
router.post('/exams', [
    (0, express_validator_1.body)('exam_name').trim().notEmpty().withMessage('Exam name is required'),
    (0, express_validator_1.body)('standard').trim().notEmpty().withMessage('Standard standard is required'),
    (0, express_validator_1.body)('total_marks').isInt({ min: 10 }).withMessage('Total marks must be at least 10'),
    validate_1.validate
], coaching_controller_1.createExam);
router.get('/exams/:examId/marksheet', coaching_controller_1.getExamMarksheet);
router.post('/exams/:examId/marksheet', coaching_controller_1.saveBulkExamResults);
router.get('/students/:studentId/report-card', coaching_controller_1.getStudentReportCardData);
// --- Staff Management ---
router.get('/staff', coaching_controller_1.getCoachingStaff);
router.post('/staff', [
    (0, express_validator_1.body)('staff_name').trim().notEmpty().withMessage('Staff name is required'),
    (0, express_validator_1.body)('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    (0, express_validator_1.body)('monthly_salary').isNumeric().withMessage('Monthly salary must be a number'),
    (0, express_validator_1.body)('status').isIn(['Active', 'Inactive']),
    validate_1.validate
], coaching_controller_1.createCoachingStaff);
router.put('/staff/:id', coaching_controller_1.updateCoachingStaff);
router.delete('/staff/:id', coaching_controller_1.deleteCoachingStaff);
// --- Batches ---
router.get('/batches', coaching_controller_1.getCoachingBatches);
router.post('/batches', [
    (0, express_validator_1.body)('batch_name').trim().notEmpty().withMessage('Batch name is required'),
    (0, express_validator_1.body)('standard').trim().notEmpty().withMessage('Standard is required'),
    (0, express_validator_1.body)('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    (0, express_validator_1.body)('status').isIn(['Active', 'Holiday', 'Completed']),
    validate_1.validate
], coaching_controller_1.createCoachingBatch);
router.put('/batches/:id', coaching_controller_1.updateCoachingBatch);
router.delete('/batches/:id', coaching_controller_1.deleteCoachingBatch);
// --- Fee Auto Generation ---
router.post('/fees/auto-generate', coaching_controller_1.autoGenerateMonthlyFees);
// --- Attendance ---
router.get('/attendance', coaching_controller_1.getCoachingAttendance);
router.post('/attendance', coaching_controller_1.markCoachingAttendance);
// --- Analytics ---
router.get('/analytics', coaching_controller_1.getCoachingAnalytics);
exports.default = router;
