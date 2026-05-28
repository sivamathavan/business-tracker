import { Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';
import { cleanMobile } from './auth.controller';

// Helper to compute payment status for projects
const computeProjectFields = (total: number, received: number, deadline: any) => {
  const balance = total - received;
  let status = 'Pending';
  
  if (received >= total) {
    status = 'Paid';
  } else if (received > 0) {
    status = 'Partial';
  }

  if (status !== 'Paid' && deadline && new Date(deadline) < new Date()) {
    status = 'Overdue';
  }

  return { balance, status };
};

// ==========================================
// PROJECTS SECTION
// ==========================================

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.techProject.findMany({
      where: { deleted_at: null },
      orderBy: [
        { is_pinned: 'desc' },
        { created_at: 'desc' }
      ]
    });
    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_name,
      client_name,
      client_mobile,
      project_type,
      status,
      priority,
      start_date,
      deadline_date,
      delivery_date,
      total_amount,
      amount_received,
      notes
    } = req.body;

    const total = Number(total_amount || 0);
    const received = Number(amount_received || 0);
    const { status: payStatus } = computeProjectFields(total, received, deadline_date);

    const project = await prisma.techProject.create({
      data: {
        project_name,
        client_name,
        client_mobile: client_mobile ? cleanMobile(client_mobile) : null,
        project_type,
        status,
        priority,
        start_date: start_date ? new Date(start_date) : null,
        deadline_date: deadline_date ? new Date(deadline_date) : null,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        total_amount: total,
        amount_received: received,
        notes,
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'CREATE', `Project: ${project_name}`);

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      project_name,
      client_name,
      client_mobile,
      project_type,
      status,
      priority,
      start_date,
      deadline_date,
      delivery_date,
      total_amount,
      amount_received,
      notes,
      is_pinned
    } = req.body;

    const existing = await prisma.techProject.findUnique({ where: { project_id: id } });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const total = total_amount !== undefined ? Number(total_amount) : Number(existing.total_amount);
    const received = amount_received !== undefined ? Number(amount_received) : Number(existing.amount_received);
    const deadline = deadline_date !== undefined ? deadline_date : existing.deadline_date;

    const updated = await prisma.techProject.update({
      where: { project_id: id },
      data: {
        project_name: project_name !== undefined ? project_name : existing.project_name,
        client_name: client_name !== undefined ? client_name : existing.client_name,
        client_mobile: client_mobile !== undefined ? (client_mobile ? cleanMobile(client_mobile) : null) : existing.client_mobile,
        project_type: project_type !== undefined ? project_type : existing.project_type,
        status: status !== undefined ? status : existing.status,
        priority: priority !== undefined ? priority : existing.priority,
        start_date: start_date !== undefined ? (start_date ? new Date(start_date) : null) : existing.start_date,
        deadline_date: deadline_date !== undefined ? (deadline_date ? new Date(deadline_date) : null) : existing.deadline_date,
        delivery_date: delivery_date !== undefined ? (delivery_date ? new Date(delivery_date) : null) : existing.delivery_date,
        total_amount: total,
        amount_received: received,
        notes: notes !== undefined ? notes : existing.notes,
        is_pinned: is_pinned !== undefined ? is_pinned : existing.is_pinned,
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'UPDATE', `Project: ${updated.project_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await prisma.techProject.findUnique({ where: { project_id: id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await prisma.techProject.update({
      where: { project_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'DELETE', `Project: ${project.project_name}`);

    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INVOICES SECTION
// ==========================================

export const getInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const invoices = await prisma.techInvoice.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { invoice_number, client_name, project_name, amount, date_sent, due_date, status, notes } = req.body;

    const invoice = await prisma.techInvoice.create({
      data: {
        invoice_number,
        client_name,
        project_name,
        amount: Number(amount || 0),
        date_sent: date_sent ? new Date(date_sent) : null,
        due_date: due_date ? new Date(due_date) : null,
        status,
        notes,
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'CREATE', `Invoice: ${invoice_number}`);

    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { invoice_number, client_name, project_name, amount, date_sent, due_date, status, notes } = req.body;

    const existing = await prisma.techInvoice.findUnique({ where: { invoice_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const updated = await prisma.techInvoice.update({
      where: { invoice_id: id },
      data: {
        invoice_number: invoice_number || existing.invoice_number,
        client_name: client_name || existing.client_name,
        project_name: project_name || existing.project_name,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        date_sent: date_sent !== undefined ? (date_sent ? new Date(date_sent) : null) : existing.date_sent,
        due_date: due_date !== undefined ? (due_date ? new Date(due_date) : null) : existing.due_date,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'UPDATE', `Invoice: ${updated.invoice_number}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.techInvoice.findUnique({ where: { invoice_id: id } });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    await prisma.techInvoice.update({
      where: { invoice_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'DELETE', `Invoice: ${invoice.invoice_number}`);

    return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PROPOSALS SECTION
// ==========================================

export const getProposals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const proposals = await prisma.techProposal.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

export const createProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { lead_name, lead_mobile, service_type, proposal_value, date_sent, followup_date, status, notes } = req.body;

    const proposal = await prisma.techProposal.create({
      data: {
        lead_name,
        lead_mobile: lead_mobile ? cleanMobile(lead_mobile) : null,
        service_type,
        proposal_value: Number(proposal_value || 0),
        date_sent: date_sent ? new Date(date_sent) : null,
        followup_date: followup_date ? new Date(followup_date) : null,
        status,
        notes,
        created_by: req.user?.userId || 'system'
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'CREATE', `Proposal for: ${lead_name}`);

    return res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { lead_name, lead_mobile, service_type, proposal_value, date_sent, followup_date, status, notes } = req.body;

    const existing = await prisma.techProposal.findUnique({ where: { proposal_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const updated = await prisma.techProposal.update({
      where: { proposal_id: id },
      data: {
        lead_name: lead_name || existing.lead_name,
        lead_mobile: lead_mobile !== undefined ? (lead_mobile ? cleanMobile(lead_mobile) : null) : existing.lead_mobile,
        service_type: service_type || existing.service_type,
        proposal_value: proposal_value !== undefined ? Number(proposal_value) : existing.proposal_value,
        date_sent: date_sent !== undefined ? (date_sent ? new Date(date_sent) : null) : existing.date_sent,
        followup_date: followup_date !== undefined ? (followup_date ? new Date(followup_date) : null) : existing.followup_date,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'UPDATE', `Proposal for: ${updated.lead_name}`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const proposal = await prisma.techProposal.findUnique({ where: { proposal_id: id } });
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    await prisma.techProposal.update({
      where: { proposal_id: id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Technology', 'DELETE', `Proposal for: ${proposal.lead_name}`);

    return res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ANALYTICS SECTION
// ==========================================

export const getTechAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Core aggregates
    const projects = await prisma.techProject.findMany({ where: { deleted_at: null } });
    const invoices = await prisma.techInvoice.findMany({ where: { deleted_at: null } });

    let collected = 0;
    let pending = 0;

    projects.forEach(p => {
      collected += Number(p.amount_received || 0);
      pending += Math.max(0, Number(p.total_amount || 0) - Number(p.amount_received || 0));
    });

    // 2. Project types distribution
    const typeBreakdown: Record<string, number> = {};
    projects.forEach(p => {
      typeBreakdown[p.project_type] = (typeBreakdown[p.project_type] || 0) + Number(p.total_amount);
    });
    const projectTypes = Object.entries(typeBreakdown).map(([name, value]) => ({ name, value }));

    // 3. Top 5 clients by revenue
    const clientBreakdown: Record<string, { name: string; value: number; mobile: string }> = {};
    projects.forEach(p => {
      const current = clientBreakdown[p.client_name] || { name: p.client_name, value: 0, mobile: p.client_mobile || '' };
      current.value += Number(p.amount_received || 0);
      clientBreakdown[p.client_name] = current;
    });
    const topClients = Object.values(clientBreakdown)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 4. Monthly Trend (12 Months)
    // We group invoices by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((m, index) => {
      // Find invoices sent in this month/year and paid
      const monthInvoices = invoices.filter(inv => {
        if (!inv.date_sent) return false;
        const d = new Date(inv.date_sent);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });

      let revenue = 0;
      let invoicesPending = 0;

      monthInvoices.forEach(inv => {
        if (inv.status === 'Paid') {
          revenue += Number(inv.amount);
        } else {
          invoicesPending += Number(inv.amount);
        }
      });

      return {
        name: m,
        revenue,
        pending: invoicesPending
      };
    });

    // Growth MoM
    const thisMonthIdx = new Date().getMonth();
    const lastMonthIdx = thisMonthIdx === 0 ? 11 : thisMonthIdx - 1;

    const thisMonthRev = monthlyData[thisMonthIdx]?.revenue || 0;
    const lastMonthRev = monthlyData[lastMonthIdx]?.revenue || 0;
    let growthRate = 0;

    if (lastMonthRev > 0) {
      growthRate = Number((((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1));
    } else if (thisMonthRev > 0) {
      growthRate = 100;
    }

    return res.status(200).json({
      success: true,
      analytics: {
        totalCollected: collected,
        totalPending: pending,
        growthRate,
        projectTypes,
        topClients,
        monthlyTrend: monthlyData,
        thisMonthRev,
        lastMonthRev
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TECH PROJECT MILESTONES
// ==========================================

export const getProjectMilestones = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const milestones = await prisma.techProjectMilestone.findMany({
      where: { project_id: projectId, deleted_at: null },
      orderBy: { target_date: 'asc' }
    });
    return res.status(200).json({ success: true, data: milestones });
  } catch (error) { next(error); }
};

export const createProjectMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, title, description, target_date } = req.body;
    
    const milestone = await prisma.techProjectMilestone.create({
      data: {
        project_id,
        title,
        description,
        target_date: new Date(target_date),
        status: 'Pending'
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Tech Services', 'CREATE', `Added milestone: ${title}`);
    return res.status(201).json({ success: true, message: 'Milestone created successfully', data: milestone });
  } catch (error) { next(error); }
};

export const updateProjectMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, target_date, status, completion_date } = req.body;
    
    const milestone = await prisma.techProjectMilestone.update({
      where: { id },
      data: {
        title,
        description,
        target_date: target_date ? new Date(target_date) : undefined,
        status,
        completion_date: completion_date ? new Date(completion_date) : undefined
      }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Tech Services', 'UPDATE', `Updated milestone: ${title}`);
    return res.status(200).json({ success: true, message: 'Milestone updated successfully', data: milestone });
  } catch (error) { next(error); }
};

export const deleteProjectMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.techProjectMilestone.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logActivity(req.user?.userId || 'system', 'Rturox Tech Services', 'DELETE', `Deleted milestone ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) { next(error); }
};
