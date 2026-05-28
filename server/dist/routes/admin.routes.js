"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Apply global admin authentication gates
router.use(auth_1.requireAuth);
router.use(auth_1.requireAdmin);
// --- Overview Dashboard stats ---
router.get('/overview', admin_controller_1.getAdminOverview);
// --- User Profiles Management ---
router.get('/users', admin_controller_1.getUsers);
router.post('/users', [
    (0, express_validator_1.body)('userId').trim().notEmpty().withMessage('User ID is required'),
    (0, express_validator_1.body)('passcode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Passcode PIN must be exactly 6 digits'),
    (0, express_validator_1.body)('role').isIn(['ADMIN', 'USER']),
    validate_1.validate
], admin_controller_1.createUser);
router.post('/users/passcode', [
    (0, express_validator_1.body)('userId').trim().notEmpty().withMessage('User ID is required'),
    (0, express_validator_1.body)('newPasscode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('New passcode must be a 6-digit PIN'),
    validate_1.validate
], admin_controller_1.changeUserPasscode);
router.delete('/users/:id', admin_controller_1.deleteUser);
// --- Business status controls ---
router.post('/business/toggle', [
    (0, express_validator_1.body)('businessId').trim().notEmpty().withMessage('Business ID is required'),
    (0, express_validator_1.body)('isActive').isBoolean().withMessage('isActive must be a boolean flag'),
    validate_1.validate
], admin_controller_1.toggleBusinessStatus);
router.post('/business/reset', [
    (0, express_validator_1.body)('slug').isIn(['tech', 'realestate', 'training', 'coaching']).withMessage('A valid business slug is required'),
    validate_1.validate
], admin_controller_1.resetBusinessData);
// --- Global Activity Logs ---
router.get('/activity', admin_controller_1.getActivityLogs);
// --- Consolidated financials ---
router.get('/revenue', admin_controller_1.getConsolidatedRevenueTrend);
// --- User Management ---
router.get('/users', admin_controller_1.getUsers);
router.post('/users', admin_controller_1.createUser);
router.put('/users/:id', admin_controller_1.changeUserPasscode);
router.delete('/users/:id', admin_controller_1.deleteUser);
exports.default = router;
