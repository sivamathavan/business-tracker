"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post('/login', [
    (0, express_validator_1.body)('userId').trim().notEmpty().withMessage('User ID is required'),
    (0, express_validator_1.body)('passcode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Passcode must be a 6-digit PIN'),
    validate_1.validate
], auth_controller_1.login);
router.post('/logout', auth_controller_1.logout);
router.post('/refresh', auth_controller_1.refresh);
router.get('/me', auth_1.requireAuth, auth_controller_1.me);
exports.default = router;
