"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const re_controller_1 = require("../controllers/re.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireBusiness)(['realestate']));
// --- People ---
router.get('/people', re_controller_1.getPeople);
router.post('/people', re_controller_1.createPerson);
router.put('/people/:id', re_controller_1.updatePerson);
router.delete('/people/:id', re_controller_1.deletePerson);
// --- Deals ---
router.get('/deals', re_controller_1.getDeals);
router.post('/deals', re_controller_1.createDeal);
router.put('/deals/:id', re_controller_1.updateDeal);
router.delete('/deals/:id', re_controller_1.deleteDeal);
// --- Properties ---
router.get('/properties', re_controller_1.getProperties);
router.post('/properties', re_controller_1.createProperty);
router.put('/properties/:id', re_controller_1.updateProperty);
router.delete('/properties/:id', re_controller_1.deleteProperty);
// --- Commissions ---
router.get('/commissions', re_controller_1.getCommissions);
router.post('/commissions', re_controller_1.createCommission);
router.put('/commissions/:id', re_controller_1.updateCommission);
router.delete('/commissions/:id', re_controller_1.deleteCommission);
// --- Payouts ---
router.get('/payouts', re_controller_1.getPayouts);
router.post('/payouts', re_controller_1.createPayout);
router.put('/payouts/:id', re_controller_1.updatePayout);
router.delete('/payouts/:id', re_controller_1.deletePayout);
// --- People Payments ---
router.get('/people-payments', re_controller_1.getPeoplePayments);
router.post('/people-payments', re_controller_1.createPeoplePayment);
router.put('/people-payments/:id', re_controller_1.updatePeoplePayment);
router.delete('/people-payments/:id', re_controller_1.deletePeoplePayment);
// --- Activity ---
router.get('/activity', re_controller_1.getActivity);
router.post('/activity', re_controller_1.createActivity);
// --- Analytics ---
router.get('/analytics', re_controller_1.getReAnalytics);
exports.default = router;
