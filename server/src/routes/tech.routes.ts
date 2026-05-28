import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getProposals,
  createProposal,
  updateProposal,
  deleteProposal,
  getTechAnalytics,
  getProjectMilestones,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone
} from '../controllers/tech.controller';
import { requireAuth, requireBusiness } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Apply auth and tenant validation (Admins can bypass, Tech users are validated)
router.use(requireAuth);
router.use(requireBusiness(['tech']));

// --- Projects ---
router.get('/projects', getProjects);
router.post(
  '/projects',
  [
    body('project_name').trim().notEmpty().withMessage('Project name is required'),
    body('client_name').trim().notEmpty().withMessage('Client name is required'),
    body('project_type').isIn(['Website', 'Web App', 'Mobile App', 'Automation', 'Marketing']),
    body('status').isIn(['Lead', 'In Progress', 'Review', 'Completed', 'On Hold']),
    body('priority').isIn(['High', 'Medium', 'Low']),
    body('total_amount').isNumeric().withMessage('Total amount must be a number'),
    validate
  ],
  createProject
);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// --- Invoices ---
router.get('/invoices', getInvoices);
router.post(
  '/invoices',
  [
    body('invoice_number').trim().notEmpty().withMessage('Invoice number is required'),
    body('amount').isNumeric().withMessage('Invoice amount must be a number'),
    validate
  ],
  createInvoice
);
router.put('/invoices/:id', updateInvoice);
router.delete('/invoices/:id', deleteInvoice);

// --- Proposals ---
router.get('/proposals', getProposals);
router.post(
  '/proposals',
  [
    body('lead_name').trim().notEmpty().withMessage('Lead name is required'),
    body('service_type').isIn(['Website', 'Web App', 'Mobile App', 'Automation', 'Marketing']),
    body('proposal_value').isNumeric().withMessage('Proposal value must be a number'),
    validate
  ],
  createProposal
);
router.put('/proposals/:id', updateProposal);
router.delete('/proposals/:id', deleteProposal);


// --- Milestones ---
router.get('/projects/:projectId/milestones', getProjectMilestones);
router.post('/projects/milestones', createProjectMilestone);
router.put('/projects/milestones/:id', updateProjectMilestone);
router.delete('/projects/milestones/:id', deleteProjectMilestone);

// --- Analytics ---

router.get('/analytics', getTechAnalytics);

export default router;
