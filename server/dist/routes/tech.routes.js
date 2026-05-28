"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const tech_controller_1 = require("../controllers/tech.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// Apply auth and tenant validation (Admins can bypass, Tech users are validated)
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireBusiness)(['tech']));
// --- Projects ---
router.get('/projects', tech_controller_1.getProjects);
router.post('/projects', [
    (0, express_validator_1.body)('project_name').trim().notEmpty().withMessage('Project name is required'),
    (0, express_validator_1.body)('client_name').trim().notEmpty().withMessage('Client name is required'),
    (0, express_validator_1.body)('project_type').isIn(['Website', 'Web App', 'Mobile App', 'Automation', 'Marketing']),
    (0, express_validator_1.body)('status').isIn(['Lead', 'In Progress', 'Review', 'Completed', 'On Hold']),
    (0, express_validator_1.body)('priority').isIn(['High', 'Medium', 'Low']),
    (0, express_validator_1.body)('total_amount').isNumeric().withMessage('Total amount must be a number'),
    validate_1.validate
], tech_controller_1.createProject);
router.put('/projects/:id', tech_controller_1.updateProject);
router.delete('/projects/:id', tech_controller_1.deleteProject);
// --- Invoices ---
router.get('/invoices', tech_controller_1.getInvoices);
router.post('/invoices', [
    (0, express_validator_1.body)('invoice_number').trim().notEmpty().withMessage('Invoice number is required'),
    (0, express_validator_1.body)('amount').isNumeric().withMessage('Invoice amount must be a number'),
    validate_1.validate
], tech_controller_1.createInvoice);
router.put('/invoices/:id', tech_controller_1.updateInvoice);
router.delete('/invoices/:id', tech_controller_1.deleteInvoice);
// --- Proposals ---
router.get('/proposals', tech_controller_1.getProposals);
router.post('/proposals', [
    (0, express_validator_1.body)('lead_name').trim().notEmpty().withMessage('Lead name is required'),
    (0, express_validator_1.body)('service_type').isIn(['Website', 'Web App', 'Mobile App', 'Automation', 'Marketing']),
    (0, express_validator_1.body)('proposal_value').isNumeric().withMessage('Proposal value must be a number'),
    validate_1.validate
], tech_controller_1.createProposal);
router.put('/proposals/:id', tech_controller_1.updateProposal);
router.delete('/proposals/:id', tech_controller_1.deleteProposal);
// --- Milestones ---
router.get('/projects/:projectId/milestones', tech_controller_1.getProjectMilestones);
router.post('/projects/milestones', tech_controller_1.createProjectMilestone);
router.put('/projects/milestones/:id', tech_controller_1.updateProjectMilestone);
router.delete('/projects/milestones/:id', tech_controller_1.deleteProjectMilestone);
// --- Analytics ---
router.get('/analytics', tech_controller_1.getTechAnalytics);
exports.default = router;
