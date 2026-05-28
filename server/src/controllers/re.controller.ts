import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../prisma';

export const getPeople = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.rePerson.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



const parsePeoplePayload = (body: any) => {
  const data = { ...body };
  if (data.created_at === '') delete data.created_at;
  if (data.buyer_budget === '') data.buyer_budget = null;
  if (data.commission_rate === '') data.commission_rate = 0;
  if (data.total_commission === '') data.total_commission = 0;
  return data;
};

export const createPerson = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePeoplePayload(req.body);
    const data = await prisma.rePerson.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updatePerson = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePeoplePayload(req.body);
    delete parsedData.id;
    const data = await prisma.rePerson.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deletePerson = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.rePerson.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getDeals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.reDeal.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



const parseDealPayload = (body: any) => {
  const data = { ...body };
  if (!data.follow_up_date) data.follow_up_date = null;
  else data.follow_up_date = new Date(data.follow_up_date);
  
  if (data.documents && Array.isArray(data.documents)) {
    data.documents = JSON.stringify(data.documents);
  } else if (!data.documents) {
    data.documents = JSON.stringify([]);
  }
  
  // Clean up frontend-only or empty string fields if they map to decimals
  if (data.property_value === '') data.property_value = 0;
  if (data.commission_rate_seller === '') data.commission_rate_seller = 0;
  if (data.commission_rate_buyer === '') data.commission_rate_buyer = 0;
  if (data.commission_amount === '') data.commission_amount = 0;
  if (data.commission_received === '') data.commission_received = 0;
  if (data.token_amount === '') data.token_amount = 0;

  // Ensure created_at from frontend isn't forced as empty string
  if (data.created_at === '') delete data.created_at;

  return data;
};

export const createDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parseDealPayload(req.body);
    const data = await prisma.reDeal.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updateDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parseDealPayload(req.body);
    delete parsedData.id; // ensure ID is not updated
    const data = await prisma.reDeal.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deleteDeal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.reDeal.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getProperties = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.reProperty.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



const parsePropertyPayload = (body: any) => {
  const data = { ...body };
  
  if (data.doc_checklist && typeof data.doc_checklist === 'object') {
    data.doc_checklist = JSON.stringify(data.doc_checklist);
  }
  if (data.photos && Array.isArray(data.photos)) {
    data.photos = JSON.stringify(data.photos);
  } else if (!data.photos) {
    data.photos = JSON.stringify([]);
  }
  
  if (data.price === '') data.price = 0;
  if (data.created_at === '') delete data.created_at;
  
  return data;
};

export const createProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePropertyPayload(req.body);
    const data = await prisma.reProperty.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePropertyPayload(req.body);
    delete parsedData.id;
    const data = await prisma.reProperty.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.reProperty.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getCommissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.reCommissionRecord.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



const parseCommissionPayload = (body: any) => {
  const data = { ...body };
  if (!data.date) data.date = new Date().toISOString();
  else data.date = new Date(data.date).toISOString();

  if (data.created_at === '') delete data.created_at;
  
  if (data.total_value === '') data.total_value = 0;
  if (data.commission_expected === '') data.commission_expected = 0;
  if (data.commission_received === '') data.commission_received = 0;
  if (data.payout_amount === '') data.payout_amount = 0;
  
  return data;
};

export const createCommission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parseCommissionPayload(req.body);
    const data = await prisma.reCommissionRecord.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updateCommission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parseCommissionPayload(req.body);
    delete parsedData.id;
    const data = await prisma.reCommissionRecord.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deleteCommission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.reCommissionRecord.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getPayouts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.rePayout.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



const parsePayoutPayload = (body: any) => {
  const data = { ...body };
  if (!data.date) data.date = new Date().toISOString();
  else data.date = new Date(data.date).toISOString();

  if (data.created_at === '') delete data.created_at;
  if (data.amount === '') data.amount = 0;
  
  return data;
};

export const createPayout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePayoutPayload(req.body);
    const data = await prisma.rePayout.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updatePayout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePayoutPayload(req.body);
    delete parsedData.id;
    const data = await prisma.rePayout.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deletePayout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.rePayout.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getPeoplePayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.rePeoplePayment.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};



export const createPeoplePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePayoutPayload(req.body);
    const data = await prisma.rePeoplePayment.create({ data: { ...parsedData, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const updatePeoplePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsedData = parsePayoutPayload(req.body);
    delete parsedData.id;
    const data = await prisma.rePeoplePayment.update({ where: { id: req.params.id }, data: parsedData });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const deletePeoplePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.rePeoplePayment.update({ where: { id: req.params.id }, data: { deleted_at: new Date() } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.reActivity.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const createActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.reActivity.create({ data: { ...req.body, created_by: req.user?.userId || 'unknown' } });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const getReAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deals = await prisma.reDeal.findMany({ where: { deleted_at: null } });
    const commissions = await prisma.reCommissionRecord.findMany({ where: { deleted_at: null } });
    const people = await prisma.rePerson.findMany({ where: { deleted_at: null } });
    const properties = await prisma.reProperty.findMany({ where: { deleted_at: null } });

    const totalDeals = deals.length;
    const closedDeals = deals.filter((d: any) => d.status === 'Closed' || d.status === 'Completed').length;
    const pendingDeals = deals.filter((d: any) => d.status !== 'Closed' && d.status !== 'Completed' && d.status !== 'Lost').length;

    const totalExpectedCommission = commissions.reduce((sum: number, c: any) => sum + Number(c.commission_expected), 0) + deals.reduce((sum: number, d: any) => sum + Number(d.commission_amount), 0);
    const totalCollectedCommission = commissions.reduce((sum: number, c: any) => sum + Number(c.commission_received), 0) + deals.reduce((sum: number, d: any) => sum + Number(d.commission_received), 0);
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
        activeBrokers: people.filter((p: any) => p.person_type === 'Broker' && p.status === 'Active').length,
        availableProperties: properties.filter((p: any) => p.status === 'Available').length
      }
    });
  } catch (error) {
    next(error);
  }
};
