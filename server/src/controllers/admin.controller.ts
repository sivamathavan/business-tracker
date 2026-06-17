import { Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

// ==========================================
// ADMIN GLOBAL OVERVIEW
// ==========================================

let cachedOverview: any = null;
let overviewCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export const getAdminOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (cachedOverview && Date.now() - overviewCacheTime < CACHE_TTL) {
      return res.status(200).json({ success: true, data: cachedOverview });
    }

    // 1. Get all businesses
    const businesses = await prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });

    // 2. Fetch all data concurrently with exact column selection for massive performance boost
    const [
      techProjects,
      reDeals,
      reCommissions,
      trainingStudents,
      trainingFees,
      coachingFeeRecords,
      allExpenses,
      coachingActiveCount
    ] = await Promise.all([
      prisma.techProject.findMany({ where: { deleted_at: null }, select: { amount_received: true, total_amount: true } }),
      prisma.reDeal.findMany({ where: { deleted_at: null }, select: { commission_received: true, commission_amount: true } }),
      prisma.reCommissionRecord.findMany({ where: { deleted_at: null }, select: { commission_received: true, commission_expected: true } }),
      prisma.trainingStudent.findMany({ where: { deleted_at: null }, select: { student_id: true, total_fee: true } }),
      prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null }, select: { student_id: true, amount: true, status: true } }),
      prisma.coachingFeeRecord.findMany({ where: { deleted_at: null }, select: { fee_amount: true, status: true } }),
      prisma.expense.findMany({ where: { deleted_at: null }, select: { business_slug: true, amount: true } }),
      prisma.coachingStudent.count({ where: { status: 'Active', deleted_at: null } })
    ]);

    // --- Tech Calculations (mirrors tech.controller getTechAnalytics) ---
    // Collected = sum(amount_received) across all projects
    // Pending   = sum(total_amount - amount_received) for each project (floored at 0)
    let techCollected = 0;
    let techPending = 0;
    techProjects.forEach(p => {
      techCollected += Number(p.amount_received || 0);
      techPending += Math.max(0, Number(p.total_amount || 0) - Number(p.amount_received || 0));
    });

    // --- Real Estate Calculations (mirrors re.controller getReAnalytics) ---
    let reCollected = 0;
    let rePending = 0;
    
    reCommissions.forEach(c => {
      reCollected += Number(c.commission_received || 0);
      rePending += Math.max(0, Number(c.commission_expected || 0) - Number(c.commission_received || 0));
    });
    
    reDeals.forEach(d => {
      reCollected += Number(d.commission_received || 0);
      rePending += Math.max(0, Number(d.commission_amount || 0) - Number(d.commission_received || 0));
    });

    // --- Training Calculations (mirrors training.controller getTrainingAnalytics) ---
    // Collected = sum of amount in Paid installments
    // Pending   = total_fee - total collected (floored at 0)
    let trainingCollected = 0;
    trainingFees.forEach(f => {
      if (f.status === 'Paid') trainingCollected += Number(f.amount || 0);
    });
    
    let trainingPending = 0;
    trainingStudents.forEach(s => {
      const studentFees = trainingFees.filter(f => f.student_id === s.student_id && f.status === 'Paid');
      const studentCollected = studentFees.reduce((sum, f) => sum + Number(f.amount), 0);
      trainingPending += Math.max(0, Number(s.total_fee || 0) - studentCollected);
    });

    // --- Coaching Calculations (mirrors coaching.controller getCoachingAnalytics) ---
    // Collected = sum of fee_amount on Paid records
    // Pending   = sum of fee_amount on Pending + Overdue records
    const coachingFeesPaid = coachingFeeRecords.filter(f => f.status === 'Paid');
    const coachingFeesUnpaid = coachingFeeRecords.filter(f => f.status === 'Pending' || f.status === 'Overdue');
    const coachingCollected = coachingFeesPaid.reduce((sum, f) => sum + Number(f.fee_amount), 0);
    const coachingPending = coachingFeesUnpaid.reduce((sum, f) => sum + Number(f.fee_amount), 0);
    // (coachingActiveCount is now fetched concurrently above)

    // Consolidated Metrics
    const grandTotalRevenue = techCollected + reCollected + trainingCollected + coachingCollected;
    const grandTotalPending = techPending + rePending + trainingPending + coachingPending;

    // --- Expense Calculations ---
    const expenseByBiz: Record<string, number> = { tech: 0, realestate: 0, training: 0, coaching: 0 };
    allExpenses.forEach(e => {
      expenseByBiz[e.business_slug] = (expenseByBiz[e.business_slug] || 0) + Number(e.amount || 0);
    });
    const grandTotalExpenses = Object.values(expenseByBiz).reduce((s, v) => s + v, 0);

    // Tile statistics per business
    const businessTiles = businesses.map(b => {
      let revenue = 0;
      let pending = 0;
      let keyCount = 0;
      let label = 'Records';

      if (b.slug === 'tech') {
        revenue = techCollected;
        pending = techPending;
        keyCount = techProjects.length;
        label = 'Projects';
      } else if (b.slug === 'realestate') {
        revenue = reCollected;
        pending = rePending;
        keyCount = reDeals.length;
        label = 'Deals';
      } else if (b.slug === 'training') {
        revenue = trainingCollected;
        pending = trainingPending;
        keyCount = trainingStudents.length;
        label = 'Students';
      } else if (b.slug === 'coaching') {
        revenue = coachingCollected;
        pending = coachingPending;
        keyCount = coachingActiveCount;
        label = 'Students';
      }

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        isActive: b.isActive,
        revenue,
        pending,
        keyCount,
        label,
        expenses: expenseByBiz[b.slug] || 0
      };
    });

    cachedOverview = {
      grandTotalRevenue,
      grandTotalPending,
      grandTotalExpenses,
      businessTiles
    };
    overviewCacheTime = Date.now();

    return res.status(200).json({
      success: true,
      data: cachedOverview
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER ACCESS MANAGEMENT
// ==========================================

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { business: true },
      orderBy: { role: 'asc' }
    });

    const sanitizedUsers = users.map(u => ({
      id: u.id,
      userId: u.userId,
      role: u.role,
      businessId: u.businessId,
      businessName: u.business?.name || 'All Businesses (Admin)',
      businessSlug: u.business?.slug || 'admin',
      createdAt: u.createdAt
    }));

    return res.status(200).json({ success: true, data: sanitizedUsers });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, passcode, businessId, role } = req.body;

    const existing = await prisma.user.findFirst({ where: { userId, deletedAt: null } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User ID already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passcodeHash = bcrypt.hashSync(passcode, salt);

    const user = await prisma.user.create({
      data: {
        userId,
        passcodeHash,
        role: role || 'USER',
        businessId: businessId || null
      }
    });

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'CREATE', `User Account: ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      data: { id: user.id, userId: user.userId, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserPasscode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, newPasscode } = req.body;

    const user = await prisma.user.findFirst({ where: { userId, deletedAt: null } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passcodeHash = bcrypt.hashSync(newPasscode, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passcodeHash }
    });

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'UPDATE', `Changed passcode for user: ${userId}`);

    return res.status(200).json({ success: true, message: `Passcode for "${userId}" successfully modified.` });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.userId === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete the master admin account.' });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Invalidate caches if users are deleted
    cachedOverview = null;
    cachedTrend = null;

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'DELETE', `User Account: ${user.userId}`);

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BUSINESS TOGGLE & DATA CLEAR
// ==========================================

export const toggleBusinessStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId, isActive } = req.body;

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { isActive }
    });

    // Invalidate caches on toggle
    cachedOverview = null;
    cachedTrend = null;

    await logActivity(
      req.user?.userId || 'admin',
      'Admin Panel',
      'UPDATE',
      `Toggled business "${updated.name}" to ${isActive ? 'ACTIVE' : 'INACTIVE'}`
    );

    return res.status(200).json({
      success: true,
      message: `Business "${updated.name}" is now ${isActive ? 'active' : 'deactivated'}.`
    });
  } catch (error) {
    next(error);
  }
};

export const resetBusinessData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.body;

    if (slug === 'tech') {
      // All-or-nothing deletion using interactive transaction
      await prisma.$transaction([
        prisma.techInvoice.deleteMany({}),
        prisma.techProjectMilestone.deleteMany({}),
        prisma.techProject.deleteMany({}),
        prisma.techProposal.deleteMany({}),
        prisma.expense.deleteMany({ where: { business_slug: 'tech' } }),
      ]);
    } else if (slug === 'realestate') {
      await prisma.$transaction([
        prisma.reActivity.deleteMany({}),
        prisma.rePayout.deleteMany({}),
        prisma.reCommissionRecord.deleteMany({}),
        prisma.reDeal.deleteMany({}),
        prisma.rePeoplePayment.deleteMany({}),
        prisma.reProperty.deleteMany({}),
        prisma.rePerson.deleteMany({}),
        prisma.expense.deleteMany({ where: { business_slug: 'realestate' } }),
      ]);
    } else if (slug === 'training') {
      await prisma.$transaction([
        prisma.trainingAttendance.deleteMany({}),
        prisma.trainingFeeInstallment.deleteMany({}),
        prisma.trainingStudyLog.deleteMany({}),
        prisma.trainingStudent.deleteMany({}),
        prisma.trainingBatch.deleteMany({}),
        prisma.trainingCourse.deleteMany({}),
        prisma.expense.deleteMany({ where: { business_slug: 'training' } }),
      ]);
    } else if (slug === 'coaching') {
      await prisma.$transaction([
        prisma.coachingResult.deleteMany({}),
        prisma.coachingAttendance.deleteMany({}),
        prisma.coachingFeeRecord.deleteMany({}),
        prisma.coachingExam.deleteMany({}),
        prisma.coachingEnrollment.deleteMany({}),
        prisma.coachingStudent.deleteMany({}),
        prisma.coachingBatch.deleteMany({}),
        prisma.coachingStaff.deleteMany({}),
        prisma.expense.deleteMany({ where: { business_slug: 'coaching' } }),
      ]);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid business slug.' });
    }

    // Invalidate caches on reset
    cachedOverview = null;
    cachedTrend = null;

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'DELETE', `RESET business database for slug: ${slug}`);

    return res.status(200).json({
      success: true,
      message: `All database items belonging to the "${slug}" pipeline have been cleared.`
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ACTIVITY LOG & CONSOLIDATED REVENUE
// ==========================================

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' }
    });
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

let cachedTrend: any = null;
let trendCacheTime = 0;

export const getConsolidatedRevenueTrend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (cachedTrend && Date.now() - trendCacheTime < CACHE_TTL) {
      return res.status(200).json({ success: true, data: cachedTrend });
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    // Fetch data concurrently with exact column selection for massive performance boost
    // Tech: uses project amount_received grouped by project creation month (NOT invoices)
    // RE: uses closed deal commissions grouped by deal creation month
    // Training: uses amount_paid grouped by enrollment_date month
    // Coaching: uses paid fee records grouped by paid_date month
    const [
      techProjects,
      reCommissions,
      trainingFees,
      coachingFees
    ] = await Promise.all([
      prisma.techProject.findMany({ where: { deleted_at: null }, select: { created_at: true, amount_received: true } }),
      prisma.reCommissionRecord.findMany({ where: { deleted_at: null }, select: { created_at: true, commission_received: true } }),
      prisma.trainingFeeInstallment.findMany({ where: { deleted_at: null }, select: { date: true, status: true, amount: true } }),
      prisma.coachingFeeRecord.findMany({ where: { status: 'Paid', deleted_at: null }, select: { paid_date: true, fee_amount: true } })
    ]);

    const consolidatedTrend = months.map((m, idx) => {
      // Tech: sum amount_received for projects created in this month
      const techVal = techProjects.filter(p => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      }).reduce((sum, p) => sum + Number(p.amount_received || 0), 0);

      // Real estate: commission received in this month
      const reVal = reCommissions.filter(c => {
        if (!c.created_at) return false;
        const dt = new Date(c.created_at);
        return dt.getMonth() === idx && dt.getFullYear() === currentYear;
      }).reduce((sum, c) => sum + Number(c.commission_received || 0), 0);

      // Training: amount in Paid installments during this month
      const trainingVal = trainingFees.filter(f => {
        if (!f.date || f.status !== 'Paid') return false;
        const dt = new Date(f.date);
        return dt.getMonth() === idx && dt.getFullYear() === currentYear;
      }).reduce((sum, f) => sum + Number(f.amount || 0), 0);

      // Coaching: paid fee records grouped by paid_date
      const coachingVal = coachingFees.filter(f => {
        if (!f.paid_date) return false;
        const dt = new Date(f.paid_date);
        return dt.getMonth() === idx && dt.getFullYear() === currentYear;
      }).reduce((sum, f) => sum + Number(f.fee_amount), 0);

      return {
        name: m,
        'Rturox Technology': techVal,
        'DkProperties': reVal,
        'RturoxAcademy': trainingVal,
        'AchieversNest': coachingVal,
        total: techVal + reVal + trainingVal + coachingVal
      };
    });

    cachedTrend = consolidatedTrend;
    trendCacheTime = Date.now();

    return res.status(200).json({
      success: true,
      data: cachedTrend
    });
  } catch (error) {
    next(error);
  }
};




// ==========================================
// GLOBAL CROSS-BUSINESS SEARCH
// ==========================================

export const globalSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchStr = query.toLowerCase();

    const [techClients, rePeople, trainingStudents, coachingStudents] = await Promise.all([
      prisma.techProject.findMany({
        where: {
          deleted_at: null,
          OR: [
            { client_name: { contains: searchStr, mode: 'insensitive' } },
            { client_mobile: { contains: searchStr } }
          ]
        },
        select: { project_id: true, client_name: true, client_mobile: true, project_name: true, status: true, created_at: true }
      }),
      prisma.rePerson.findMany({
        where: {
          deleted_at: null,
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { mobile: { contains: searchStr } }
          ]
        },
        select: { id: true, name: true, mobile: true, person_type: true, district: true, status: true, created_at: true }
      }),
      prisma.trainingStudent.findMany({
        where: {
          deleted_at: null,
          OR: [
            { student_name: { contains: searchStr, mode: 'insensitive' } },
            { mobile: { contains: searchStr } }
          ]
        },
        select: { student_id: true, student_name: true, mobile: true, course_enrolled: true, batch_name: true, status: true, created_at: true }
      }),
      prisma.coachingStudent.findMany({
        where: {
          deleted_at: null,
          OR: [
            { student_name: { contains: searchStr, mode: 'insensitive' } },
            { parent_mobile: { contains: searchStr } },
            { student_mobile: { contains: searchStr } }
          ]
        },
        select: { student_id: true, student_name: true, parent_mobile: true, standard: true, school_name: true, status: true, created_at: true }
      })
    ]);

    // Normalize and aggregate results
    const results = [
      ...techClients.map(c => ({
        id: c.project_id,
        name: c.client_name,
        mobile: c.client_mobile,
        business: 'Rturox Tech Services',
        context: `Project: ${c.project_name} (${c.status})`,
        timestamp: c.created_at
      })),
      ...rePeople.map(p => ({
        id: p.id,
        name: p.name,
        mobile: p.mobile,
        business: 'DkProperties',
        context: `${p.person_type} - ${p.district} (${p.status})`,
        timestamp: p.created_at
      })),
      ...trainingStudents.map(s => ({
        id: s.student_id,
        name: s.student_name,
        mobile: s.mobile,
        business: 'Rturox Training',
        context: `Course: ${s.course_enrolled} | Batch: ${s.batch_name} (${s.status})`,
        timestamp: s.created_at
      })),
      ...coachingStudents.map(s => ({
        id: s.student_id,
        name: s.student_name,
        mobile: s.parent_mobile,
        business: 'Rturox Coaching',
        context: `Standard: ${s.standard} - ${s.school_name} (${s.status})`,
        timestamp: s.created_at
      }))
    ];

    // Sort by most recent
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BACKUP AND RESTORE
// ==========================================

export const exportBackup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = {
      Business: await prisma.business.findMany(),
      User: await prisma.user.findMany(),
      Expense: await prisma.expense.findMany(),
      TechProject: await prisma.techProject.findMany(),
      TechInvoice: await prisma.techInvoice.findMany(),
      TechProjectMilestone: await prisma.techProjectMilestone.findMany(),
      TechProposal: await prisma.techProposal.findMany(),
      RePerson: await prisma.rePerson.findMany(),
      ReDeal: await prisma.reDeal.findMany(),
      ReCommissionRecord: await prisma.reCommissionRecord.findMany(),
      RePeoplePayment: await prisma.rePeoplePayment.findMany(),
      RePayout: await prisma.rePayout.findMany(),
      ReProperty: await prisma.reProperty.findMany(),
      ReActivity: await prisma.reActivity.findMany(),
      TrainingCourse: await prisma.trainingCourse.findMany(),
      TrainingBatch: await prisma.trainingBatch.findMany(),
      TrainingStudent: await prisma.trainingStudent.findMany(),
      TrainingStudyLog: await prisma.trainingStudyLog.findMany(),
      TrainingFeeInstallment: await prisma.trainingFeeInstallment.findMany(),
      TrainingAttendance: await prisma.trainingAttendance.findMany(),
      CoachingStudent: await prisma.coachingStudent.findMany(),
      CoachingAttendance: await prisma.coachingAttendance.findMany(),
      CoachingFeeRecord: await prisma.coachingFeeRecord.findMany(),
      ActivityLog: await prisma.activityLog.findMany(),
    };

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'EXPORT', 'Exported full database backup');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const importRestore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup payload' });
    }

    // Safety: Verify backup contains at least one admin user
    const adminUser = backup.User?.find((u: any) => u.role === 'ADMIN');
    if (!adminUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup: No ADMIN user found in backup file. Restore aborted for safety.'
      });
    }

    // Wrap the entire restore in a transaction
    // Important: we delete in an order that respects foreign keys (if any), then create.
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing data
      await tx.activityLog.deleteMany();
      await tx.coachingFeeRecord.deleteMany();
      await tx.coachingAttendance.deleteMany();
      // CoachingEnrollment and Result if exist? (Checked schema earlier, there are CoachingEnrollments)
      if (tx.coachingEnrollment) await tx.coachingEnrollment.deleteMany();
      if (tx.coachingResult) await tx.coachingResult.deleteMany();
      await tx.coachingStudent.deleteMany();

      await tx.trainingAttendance.deleteMany();
      await tx.trainingFeeInstallment.deleteMany();
      await tx.trainingStudyLog.deleteMany();
      await tx.trainingStudent.deleteMany();
      await tx.trainingBatch.deleteMany();
      await tx.trainingCourse.deleteMany();

      await tx.reActivity.deleteMany();
      await tx.reProperty.deleteMany();
      await tx.rePayout.deleteMany();
      await tx.rePeoplePayment.deleteMany();
      await tx.reCommissionRecord.deleteMany();
      await tx.reDeal.deleteMany();
      await tx.rePerson.deleteMany();

      await tx.techProposal.deleteMany();
      await tx.techProjectMilestone.deleteMany();
      await tx.techInvoice.deleteMany();
      await tx.techProject.deleteMany();

      await tx.expense.deleteMany();
      await tx.user.deleteMany();
      await tx.business.deleteMany();

      // 2. Restore all data
      if (backup.Business && backup.Business.length > 0) await tx.business.createMany({ data: backup.Business });
      if (backup.User && backup.User.length > 0) await tx.user.createMany({ data: backup.User });
      if (backup.Expense && backup.Expense.length > 0) await tx.expense.createMany({ data: backup.Expense });
      
      if (backup.TechProject && backup.TechProject.length > 0) await tx.techProject.createMany({ data: backup.TechProject });
      if (backup.TechInvoice && backup.TechInvoice.length > 0) await tx.techInvoice.createMany({ data: backup.TechInvoice });
      if (backup.TechProjectMilestone && backup.TechProjectMilestone.length > 0) await tx.techProjectMilestone.createMany({ data: backup.TechProjectMilestone });
      if (backup.TechProposal && backup.TechProposal.length > 0) await tx.techProposal.createMany({ data: backup.TechProposal });

      if (backup.RePerson && backup.RePerson.length > 0) await tx.rePerson.createMany({ data: backup.RePerson });
      if (backup.ReDeal && backup.ReDeal.length > 0) await tx.reDeal.createMany({ data: backup.ReDeal });
      if (backup.ReCommissionRecord && backup.ReCommissionRecord.length > 0) await tx.reCommissionRecord.createMany({ data: backup.ReCommissionRecord });
      if (backup.RePeoplePayment && backup.RePeoplePayment.length > 0) await tx.rePeoplePayment.createMany({ data: backup.RePeoplePayment });
      if (backup.RePayout && backup.RePayout.length > 0) await tx.rePayout.createMany({ data: backup.RePayout });
      if (backup.ReProperty && backup.ReProperty.length > 0) await tx.reProperty.createMany({ data: backup.ReProperty });
      if (backup.ReActivity && backup.ReActivity.length > 0) await tx.reActivity.createMany({ data: backup.ReActivity });

      if (backup.TrainingCourse && backup.TrainingCourse.length > 0) await tx.trainingCourse.createMany({ data: backup.TrainingCourse });
      if (backup.TrainingBatch && backup.TrainingBatch.length > 0) await tx.trainingBatch.createMany({ data: backup.TrainingBatch });
      if (backup.TrainingStudent && backup.TrainingStudent.length > 0) await tx.trainingStudent.createMany({ data: backup.TrainingStudent });
      if (backup.TrainingStudyLog && backup.TrainingStudyLog.length > 0) await tx.trainingStudyLog.createMany({ data: backup.TrainingStudyLog });
      if (backup.TrainingFeeInstallment && backup.TrainingFeeInstallment.length > 0) await tx.trainingFeeInstallment.createMany({ data: backup.TrainingFeeInstallment });
      if (backup.TrainingAttendance && backup.TrainingAttendance.length > 0) await tx.trainingAttendance.createMany({ data: backup.TrainingAttendance });

      if (backup.CoachingStudent && backup.CoachingStudent.length > 0) await tx.coachingStudent.createMany({ data: backup.CoachingStudent });
      // Restore CoachingEnrollment and Result if exist in payload (not explicitly gathered but good to have safety)
      if (backup.CoachingEnrollment && backup.CoachingEnrollment.length > 0) await tx.coachingEnrollment.createMany({ data: backup.CoachingEnrollment });
      if (backup.CoachingResult && backup.CoachingResult.length > 0) await tx.coachingResult.createMany({ data: backup.CoachingResult });
      
      if (backup.CoachingAttendance && backup.CoachingAttendance.length > 0) await tx.coachingAttendance.createMany({ data: backup.CoachingAttendance });
      if (backup.CoachingFeeRecord && backup.CoachingFeeRecord.length > 0) await tx.coachingFeeRecord.createMany({ data: backup.CoachingFeeRecord });

      if (backup.ActivityLog && backup.ActivityLog.length > 0) await tx.activityLog.createMany({ data: backup.ActivityLog });
    });

    await logActivity(req.user?.userId || 'admin', 'Admin Panel', 'IMPORT', 'Restored database from backup');
    return res.status(200).json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    next(error);
  }
};
