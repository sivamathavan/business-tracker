"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const training_controller_1 = require("../controllers/training.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireBusiness)(['training']));
// --- Courses ---
router.get('/courses', training_controller_1.getCourses);
router.post('/courses', [
    (0, express_validator_1.body)('course_name').trim().notEmpty().withMessage('Course name is required'),
    (0, express_validator_1.body)('platform').isIn(['College', 'Online', 'YouTube', 'Udemy', 'Coursera', 'Rturox', 'Other']),
    (0, express_validator_1.body)('category').isIn(['Web Dev', 'Mobile', 'AI/ML', 'Design', 'Marketing', 'DevOps', 'Other']),
    (0, express_validator_1.body)('status').isIn(['Not Started', 'In Progress', 'Completed']),
    (0, express_validator_1.body)('total_modules').isInt({ min: 1 }).withMessage('Total modules must be at least 1'),
    (0, express_validator_1.body)('completed_modules').isInt({ min: 0 }).withMessage('Completed modules must be 0 or positive'),
    (0, express_validator_1.body)('certificate_status').isIn(['Not Applicable', 'Pending', 'Uploaded']),
    validate_1.validate
], training_controller_1.createCourse);
router.put('/courses/:id', training_controller_1.updateCourse);
router.delete('/courses/:id', training_controller_1.deleteCourse);
// --- Students ---
router.get('/students', training_controller_1.getStudents);
router.post('/students', [
    (0, express_validator_1.body)('student_name').trim().notEmpty().withMessage('Student name is required'),
    (0, express_validator_1.body)('total_fee').isNumeric().withMessage('Total fee must be a number'),
    (0, express_validator_1.body)('amount_paid').isNumeric().withMessage('Amount paid must be a number'),
    (0, express_validator_1.body)('status').isIn(['Active', 'Completed', 'Dropped']),
    validate_1.validate
], training_controller_1.createStudent);
router.put('/students/:id', training_controller_1.updateStudent);
router.delete('/students/:id', training_controller_1.deleteStudent);
// --- Batches ---
router.get('/batches', training_controller_1.getBatches);
router.post('/batches', [
    (0, express_validator_1.body)('batch_name').trim().notEmpty().withMessage('Batch name is required'),
    (0, express_validator_1.body)('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    (0, express_validator_1.body)('status').isIn(['Upcoming', 'Active', 'Completed']),
    validate_1.validate
], training_controller_1.createBatch);
router.put('/batches/:id', training_controller_1.updateBatch);
router.delete('/batches/:id', training_controller_1.deleteBatch);
// --- Study Logs ---
router.get('/studylogs', training_controller_1.getStudyLogs);
router.post('/studylogs', [
    (0, express_validator_1.body)('course_name').trim().notEmpty().withMessage('Course name is required'),
    (0, express_validator_1.body)('hours_studied').isNumeric().withMessage('Hours studied must be a number'),
    validate_1.validate
], training_controller_1.createStudyLog);
router.put('/studylogs/:id', training_controller_1.updateStudyLog);
router.delete('/studylogs/:id', training_controller_1.deleteStudyLog);
// --- Training Fee Installments ---
router.get('/fees', training_controller_1.getTrainingFeeInstallments);
router.post('/fees', training_controller_1.createTrainingFeeInstallment);
router.put('/fees/:id', training_controller_1.updateTrainingFeeInstallment);
router.delete('/fees/:id', training_controller_1.deleteTrainingFeeInstallment);
// --- Attendance ---
router.get('/attendance', training_controller_1.getTrainingAttendance);
router.post('/attendance', training_controller_1.markTrainingAttendance);
// --- Analytics ---
router.get('/analytics', training_controller_1.getTrainingAnalytics);
exports.default = router;
