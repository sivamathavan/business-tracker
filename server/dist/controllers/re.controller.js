"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReAnalytics = exports.createActivity = exports.getActivity = exports.deletePeoplePayment = exports.updatePeoplePayment = exports.createPeoplePayment = exports.getPeoplePayments = exports.deletePayout = exports.updatePayout = exports.createPayout = exports.getPayouts = exports.deleteCommission = exports.updateCommission = exports.createCommission = exports.getCommissions = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getProperties = exports.deleteDeal = exports.updateDeal = exports.createDeal = exports.getDeals = exports.deletePerson = exports.updatePerson = exports.createPerson = exports.getPeople = void 0;
const prisma_1 = require("../prisma");
const getPeople = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.rePerson.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getPeople = getPeople;
const parsePeoplePayload = (body) => {
    const data = { ...body };
    if (data.created_at === '')
        delete data.created_at;
    if (data.buyer_budget === '')
        data.buyer_budget = null;
    if (data.commission_rate === '')
        data.commission_rate = 0;
    if (data.total_commission === '')
        data.total_commission = 0;
    return data;
};
const createPerson = async (req, res, next) => {
    try {
        const parsedData = parsePeoplePayload(req.body);
        const data = await prisma_1.prisma.rePerson.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createPerson = createPerson;
const updatePerson = async (req, res, next) => {
    try {
        const parsedData = parsePeoplePayload(req.body);
        delete parsedData.id;
        const data = await prisma_1.prisma.rePerson.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePerson = updatePerson;
const deletePerson = async (req, res, next) => {
    try {
        await prisma_1.prisma.rePerson.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePerson = deletePerson;
const getDeals = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.reDeal.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeals = getDeals;
const parseDealPayload = (body) => {
    const data = { ...body };
    if (!data.follow_up_date)
        data.follow_up_date = null;
    else
        data.follow_up_date = new Date(data.follow_up_date);
    if (data.documents && Array.isArray(data.documents)) {
        data.documents = JSON.stringify(data.documents);
    }
    else if (!data.documents) {
        data.documents = JSON.stringify([]);
    }
    // Clean up frontend-only or empty string fields if they map to decimals
    if (data.property_value === '')
        data.property_value = 0;
    if (data.commission_rate_seller === '')
        data.commission_rate_seller = 0;
    if (data.commission_rate_buyer === '')
        data.commission_rate_buyer = 0;
    if (data.commission_amount === '')
        data.commission_amount = 0;
    if (data.commission_received === '')
        data.commission_received = 0;
    if (data.token_amount === '')
        data.token_amount = 0;
    // Ensure created_at from frontend isn't forced as empty string
    if (data.created_at === '')
        delete data.created_at;
    return data;
};
const createDeal = async (req, res, next) => {
    try {
        const parsedData = parseDealPayload(req.body);
        const data = await prisma_1.prisma.reDeal.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createDeal = createDeal;
const updateDeal = async (req, res, next) => {
    try {
        const parsedData = parseDealPayload(req.body);
        delete parsedData.id; // ensure ID is not updated
        const data = await prisma_1.prisma.reDeal.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDeal = updateDeal;
const deleteDeal = async (req, res, next) => {
    try {
        await prisma_1.prisma.reDeal.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDeal = deleteDeal;
const getProperties = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.reProperty.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getProperties = getProperties;
const parsePropertyPayload = (body) => {
    const data = { ...body };
    if (data.doc_checklist && typeof data.doc_checklist === 'object') {
        data.doc_checklist = JSON.stringify(data.doc_checklist);
    }
    if (data.photos && Array.isArray(data.photos)) {
        data.photos = JSON.stringify(data.photos);
    }
    else if (!data.photos) {
        data.photos = JSON.stringify([]);
    }
    if (data.price === '')
        data.price = 0;
    if (data.created_at === '')
        delete data.created_at;
    return data;
};
const createProperty = async (req, res, next) => {
    try {
        const parsedData = parsePropertyPayload(req.body);
        const data = await prisma_1.prisma.reProperty.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createProperty = createProperty;
const updateProperty = async (req, res, next) => {
    try {
        const parsedData = parsePropertyPayload(req.body);
        delete parsedData.id;
        const data = await prisma_1.prisma.reProperty.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProperty = updateProperty;
const deleteProperty = async (req, res, next) => {
    try {
        await prisma_1.prisma.reProperty.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProperty = deleteProperty;
const getCommissions = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.reCommissionRecord.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getCommissions = getCommissions;
const parseCommissionPayload = (body) => {
    const data = { ...body };
    if (!data.date)
        data.date = new Date().toISOString();
    else
        data.date = new Date(data.date).toISOString();
    if (data.created_at === '')
        delete data.created_at;
    if (data.total_value === '')
        data.total_value = 0;
    if (data.commission_expected === '')
        data.commission_expected = 0;
    if (data.commission_received === '')
        data.commission_received = 0;
    if (data.payout_amount === '')
        data.payout_amount = 0;
    return data;
};
const createCommission = async (req, res, next) => {
    try {
        const parsedData = parseCommissionPayload(req.body);
        const data = await prisma_1.prisma.reCommissionRecord.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createCommission = createCommission;
const updateCommission = async (req, res, next) => {
    try {
        const parsedData = parseCommissionPayload(req.body);
        delete parsedData.id;
        const data = await prisma_1.prisma.reCommissionRecord.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCommission = updateCommission;
const deleteCommission = async (req, res, next) => {
    try {
        await prisma_1.prisma.reCommissionRecord.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCommission = deleteCommission;
const getPayouts = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.rePayout.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getPayouts = getPayouts;
const parsePayoutPayload = (body) => {
    const data = { ...body };
    if (!data.date)
        data.date = new Date().toISOString();
    else
        data.date = new Date(data.date).toISOString();
    if (data.created_at === '')
        delete data.created_at;
    if (data.amount === '')
        data.amount = 0;
    return data;
};
const createPayout = async (req, res, next) => {
    try {
        const parsedData = parsePayoutPayload(req.body);
        const data = await prisma_1.prisma.rePayout.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createPayout = createPayout;
const updatePayout = async (req, res, next) => {
    try {
        const parsedData = parsePayoutPayload(req.body);
        delete parsedData.id;
        const data = await prisma_1.prisma.rePayout.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePayout = updatePayout;
const deletePayout = async (req, res, next) => {
    try {
        await prisma_1.prisma.rePayout.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePayout = deletePayout;
const getPeoplePayments = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.rePeoplePayment.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getPeoplePayments = getPeoplePayments;
const createPeoplePayment = async (req, res, next) => {
    try {
        const parsedData = parsePayoutPayload(req.body);
        const data = await prisma_1.prisma.rePeoplePayment.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createPeoplePayment = createPeoplePayment;
const updatePeoplePayment = async (req, res, next) => {
    try {
        const parsedData = parsePayoutPayload(req.body);
        delete parsedData.id;
        const data = await prisma_1.prisma.rePeoplePayment.update({ where: { id: req.params.id }, data: parsedData });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePeoplePayment = updatePeoplePayment;
const deletePeoplePayment = async (req, res, next) => {
    try {
        await prisma_1.prisma.rePeoplePayment.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
        return res.status(200).json({ success: true, message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePeoplePayment = deletePeoplePayment;
const getActivity = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.reActivity.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getActivity = getActivity;
const createActivity = async (req, res, next) => {
    try {
        const data = await prisma_1.prisma.reActivity.create({ data: { ...req.body, created_by: req.user?.userId || 'unknown' } });
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createActivity = createActivity;
const getReAnalytics = async (req, res, next) => {
    try {
        const deals = await prisma_1.prisma.reDeal.findMany({ where: { deleted_at: null } });
        const commissions = await prisma_1.prisma.reCommissionRecord.findMany({ where: { deleted_at: null } });
        const people = await prisma_1.prisma.rePerson.findMany({ where: { deleted_at: null } });
        const properties = await prisma_1.prisma.reProperty.findMany({ where: { deleted_at: null } });
        const totalDeals = deals.length;
        const closedDeals = deals.filter((d) => d.status === 'Closed' || d.status === 'Completed').length;
        const pendingDeals = deals.filter((d) => d.status !== 'Closed' && d.status !== 'Completed' && d.status !== 'Lost').length;
        const totalExpectedCommission = commissions.reduce((sum, c) => sum + Number(c.commission_expected), 0) + deals.reduce((sum, d) => sum + Number(d.commission_amount), 0);
        const totalCollectedCommission = commissions.reduce((sum, c) => sum + Number(c.commission_received), 0) + deals.reduce((sum, d) => sum + Number(d.commission_received), 0);
        const totalPendingCommission = totalExpectedCommission - totalCollectedCommission;
        return res.status(200).json({
            success: true,
            analytics: {
                totalDeals,
                closedDeals,
                pendingDeals,
                totalExpectedCommission,
                totalCollectedCommission,
                totalPendingCommission,
                activeBrokers: people.filter((p) => p.person_type === 'Broker' && p.status === 'Active').length,
                availableProperties: properties.filter((p) => p.status === 'Available').length
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReAnalytics = getReAnalytics;
