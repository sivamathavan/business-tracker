import { Router } from 'express';
import {
  getPeople,
  createPerson,
  updatePerson,
  deletePerson,
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getCommissions,
  createCommission,
  updateCommission,
  deleteCommission,
  getPayouts,
  createPayout,
  updatePayout,
  deletePayout,
  getPeoplePayments,
  createPeoplePayment,
  updatePeoplePayment,
  deletePeoplePayment,
  getActivity,
  createActivity,
  getReAnalytics
} from '../controllers/re.controller';
import { requireAuth, requireBusiness } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireBusiness(['realestate']));

// --- People ---
router.get('/people', getPeople);
router.post('/people', createPerson);
router.put('/people/:id', updatePerson);
router.delete('/people/:id', deletePerson);

// --- Deals ---
router.get('/deals', getDeals);
router.post('/deals', createDeal);
router.put('/deals/:id', updateDeal);
router.delete('/deals/:id', deleteDeal);

// --- Properties ---
router.get('/properties', getProperties);
router.post('/properties', createProperty);
router.put('/properties/:id', updateProperty);
router.delete('/properties/:id', deleteProperty);

// --- Commissions ---
router.get('/commissions', getCommissions);
router.post('/commissions', createCommission);
router.put('/commissions/:id', updateCommission);
router.delete('/commissions/:id', deleteCommission);

// --- Payouts ---
router.get('/payouts', getPayouts);
router.post('/payouts', createPayout);
router.put('/payouts/:id', updatePayout);
router.delete('/payouts/:id', deletePayout);

// --- People Payments ---
router.get('/people-payments', getPeoplePayments);
router.post('/people-payments', createPeoplePayment);
router.put('/people-payments/:id', updatePeoplePayment);
router.delete('/people-payments/:id', deletePeoplePayment);

// --- Activity ---
router.get('/activity', getActivity);
router.post('/activity', createActivity);

// --- Analytics ---
router.get('/analytics', getReAnalytics);

export default router;
