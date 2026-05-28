import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  // Delete records in reverse order of dependency
  await prisma.coachingResult.deleteMany({});
  await prisma.coachingExam.deleteMany({});
  await prisma.coachingStaff.deleteMany({});
  await prisma.coachingBatch.deleteMany({});
  await prisma.coachingFeeRecord.deleteMany({});
  await prisma.coachingStudent.deleteMany({});
  await prisma.trainingStudyLog.deleteMany({});
  await prisma.trainingFeeInstallment.deleteMany({});
  await prisma.trainingBatch.deleteMany({});
  await prisma.trainingStudent.deleteMany({});
  await prisma.trainingCourse.deleteMany({});
  await prisma.reActivity.deleteMany({});
  await prisma.rePeoplePayment.deleteMany({});
  await prisma.rePayout.deleteMany({});
  await prisma.reCommissionRecord.deleteMany({});
  await prisma.reProperty.deleteMany({});
  await prisma.reDeal.deleteMany({});
  await prisma.rePerson.deleteMany({});
  await prisma.techProposal.deleteMany({});
  await prisma.techInvoice.deleteMany({});
  await prisma.techProject.deleteMany({});
  await prisma.pinnedRecord.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('Seeding Businesses...');
  const techBiz = await prisma.business.create({
    data: { name: 'Rturox Technology', slug: 'tech' }
  });
  const reBiz = await prisma.business.create({
    data: { name: 'AadanaTharakar', slug: 'realestate' }
  });
  const trainingBiz = await prisma.business.create({
    data: { name: 'RturoxAcademy', slug: 'training' }
  });
  const coachingBiz = await prisma.business.create({
    data: { name: 'CKS Tuition', slug: 'coaching' }
  });

  console.log('Seeding Users...');
  const salt = bcrypt.genSaltSync(10);
  
  // Admin user has no specific businessId (or can access all)
  await prisma.user.create({
    data: {
      userId: 'admin',
      passcodeHash: bcrypt.hashSync('123456', salt),
      role: 'ADMIN',
    }
  });

  // Business specific users
  await prisma.user.create({
    data: {
      userId: 'rturox_tech',
      passcodeHash: bcrypt.hashSync('111111', salt),
      role: 'USER',
      businessId: techBiz.id
    }
  });

  await prisma.user.create({
    data: {
      userId: 'dreamkey',
      passcodeHash: bcrypt.hashSync('222222', salt),
      role: 'USER',
      businessId: reBiz.id
    }
  });

  await prisma.user.create({
    data: {
      userId: 'rturox_training',
      passcodeHash: bcrypt.hashSync('333333', salt),
      role: 'USER',
      businessId: trainingBiz.id
    }
  });

  await prisma.user.create({
    data: {
      userId: 'rturox_coaching',
      passcodeHash: bcrypt.hashSync('444444', salt),
      role: 'USER',
      businessId: coachingBiz.id
    }
  });

  // ---------------------------------------------------------------------------
  // BUSINESS 1 - RTUROX TECHNOLOGY SEED
  // ---------------------------------------------------------------------------
  console.log('Seeding Rturox Technology Data...');
  
  await prisma.techProject.createMany({
    data: [
      {
        project_name: 'E-Commerce Platform Redesign',
        client_name: 'Aravind Swamy',
        client_mobile: '919876543210',
        project_type: 'Web App',
        status: 'In Progress',
        priority: 'High',
        start_date: new Date('2026-04-15'),
        deadline_date: new Date('2026-06-30'),
        total_amount: 150000,
        amount_received: 50000,
        notes: 'Needs integration with local payment gateway (UPI).',
        created_by: 'rturox_tech',
      },
      {
        project_name: 'Corporate Website & Branding',
        client_name: 'Meera Nair',
        client_mobile: '919845612301',
        project_type: 'Website',
        status: 'Review',
        priority: 'Medium',
        start_date: new Date('2026-05-01'),
        deadline_date: new Date('2026-05-28'),
        delivery_date: new Date('2026-05-26'),
        total_amount: 80000,
        amount_received: 80000,
        notes: 'Under review by client. Minor design tweaks requested.',
        created_by: 'rturox_tech',
      },
      {
        project_name: 'Inventory Automation Tool',
        client_name: 'Rajesh Kumar',
        client_mobile: '919894012345',
        project_type: 'Automation',
        status: 'Completed',
        priority: 'Low',
        start_date: new Date('2026-02-10'),
        deadline_date: new Date('2026-04-10'),
        delivery_date: new Date('2026-04-05'),
        total_amount: 120000,
        amount_received: 120000,
        notes: 'Delivered successfully. Client fully satisfied.',
        created_by: 'rturox_tech',
      },
      {
        project_name: 'Mobile Delivery App',
        client_name: 'Vikram Singh',
        client_mobile: '919962054321',
        project_type: 'Mobile App',
        status: 'Lead',
        priority: 'High',
        start_date: new Date('2026-06-01'),
        deadline_date: new Date('2026-09-15'),
        total_amount: 250000,
        amount_received: 0,
        notes: 'Proposal sent, waiting for advance deposit.',
        created_by: 'rturox_tech',
      },
      {
        project_name: 'SaaS SEO Campaign',
        client_name: 'Aravind Swamy',
        client_mobile: '919876543210',
        project_type: 'Marketing',
        status: 'On Hold',
        priority: 'Medium',
        start_date: new Date('2026-03-01'),
        deadline_date: new Date('2026-08-01'),
        total_amount: 90000,
        amount_received: 30000,
        notes: 'Temporarily on hold due to budget constraints on client side.',
        created_by: 'rturox_tech',
      }
    ]
  });

  await prisma.techInvoice.createMany({
    data: [
      {
        invoice_number: 'INV-2026-001',
        client_name: 'Aravind Swamy',
        project_name: 'E-Commerce Platform Redesign',
        amount: 50000,
        date_sent: new Date('2026-04-15'),
        due_date: new Date('2026-04-30'),
        status: 'Paid',
        notes: 'Advance deposit.',
        created_by: 'rturox_tech'
      },
      {
        invoice_number: 'INV-2026-002',
        client_name: 'Meera Nair',
        project_name: 'Corporate Website & Branding',
        amount: 80000,
        date_sent: new Date('2026-05-01'),
        due_date: new Date('2026-05-15'),
        status: 'Paid',
        notes: 'Full payment.',
        created_by: 'rturox_tech'
      },
      {
        invoice_number: 'INV-2026-003',
        client_name: 'Aravind Swamy',
        project_name: 'E-Commerce Platform Redesign',
        amount: 50000,
        date_sent: new Date('2026-05-20'),
        due_date: new Date('2026-06-05'),
        status: 'Pending',
        notes: 'Milestone 2 payment.',
        created_by: 'rturox_tech'
      }
    ]
  });

  await prisma.techProposal.createMany({
    data: [
      {
        lead_name: 'Karthik Rao',
        lead_mobile: '919500123456',
        service_type: 'Web App',
        proposal_value: 180000,
        date_sent: new Date('2026-05-10'),
        followup_date: new Date('2026-05-28'),
        status: 'Followed Up',
        notes: 'Client interested in standard React admin panel integration.',
        created_by: 'rturox_tech'
      },
      {
        lead_name: 'Suresh Raina',
        lead_mobile: '919888877777',
        service_type: 'Automation',
        proposal_value: 65000,
        date_sent: new Date('2026-05-15'),
        followup_date: new Date('2026-05-30'),
        status: 'Sent',
        notes: 'Initial pitch for business workflow automation.',
        created_by: 'rturox_tech'
      },
      {
        lead_name: 'Anjali Sharma',
        lead_mobile: '919444455555',
        service_type: 'Website',
        proposal_value: 45000,
        date_sent: new Date('2026-04-20'),
        followup_date: new Date('2026-05-05'),
        status: 'Won',
        notes: 'Signed and converted to Corporate Website project.',
        created_by: 'rturox_tech'
      }
    ]
  });

  
  // ---------------------------------------------------------------------------
  // BUSINESS 2 - DREAMKEY PROPERTIES SEED
  // ---------------------------------------------------------------------------
  console.log('Seeding AadanaTharakar Data...');

  await prisma.rePerson.createMany({
    data: [
      { name: 'Karthik Selvam', person_type: 'Broker', mobile: '9876543210', email: 'karthik@mail.com', district: 'Madurai', area: 'Thirumangalam', company: 'SK Realty', rera_id: 'TN-RE-0012', commission_giver: true, commission_rate: 1.5, total_commission: 225000, status: 'Active', pinned: true, notes: 'Top performer Q1', specialization: 'Agricultural Land', created_by: 'dreamkey' },
      { name: 'Priya Devi', person_type: 'Broker', mobile: '9871234567', email: 'priya@mail.com', district: 'Coimbatore', area: 'RS Puram', company: 'Priya Properties', rera_id: 'TN-RE-0034', commission_giver: true, commission_rate: 2.0, total_commission: 180000, status: 'Active', pinned: false, notes: '', specialization: 'Residential Plot', created_by: 'dreamkey' },
      { name: 'Rajan Murugan', person_type: 'Land Owner', mobile: '9865432100', email: 'rajan@mail.com', district: 'Salem', area: 'Attur', company: '', rera_id: '', commission_giver: false, commission_rate: 0, total_commission: 0, status: 'Active', pinned: false, notes: 'Owns 10 acres at Attur', specialization: '', created_by: 'dreamkey' },
      { name: 'Vijay Kumar', person_type: 'Builder', mobile: '9843211234', email: 'vijay@build.com', district: 'Tiruchirappalli', area: 'Srirangam', company: 'VK Constructions', rera_id: 'TN-BLD-0088', commission_giver: true, commission_rate: 1.0, total_commission: 95000, status: 'Active', pinned: false, notes: '', specialization: 'Villa', created_by: 'dreamkey' }
    ]
  });

  await prisma.reProperty.createMany({
    data: [
      { title: '3 Acres NH Facing Land', property_type: 'Agricultural Land', status: 'Available', district: 'Madurai', area: 'Thirumangalam', extent: '3 Acres', road_facing: '60 ft NH', price: 4500000, price_per_unit: '₹15L/acre', submitter_type: 'Broker', submitter_name: 'Karthik Selvam', submitter_mobile: '9876543210', owner_name: 'Rajan M', owner_mobile: '9865432100', survey_number: '145/2A', maps_link: '', doc_checklist: JSON.stringify({ 'Patta': 'Verified', 'Chitta': 'Verified', 'FMB Sketch': 'Received' }), photos: '[]', notes: 'NH-44 side, good frontage', created_by: 'dreamkey' },
      { title: '1.5 Acres Attur Land', property_type: 'Agricultural Land', status: 'Under Deal', district: 'Salem', area: 'Attur', extent: '1.5 Acres', road_facing: '30 ft', price: 1800000, price_per_unit: '₹12L/acre', submitter_type: 'Owner Direct', submitter_name: 'Rajan Murugan', submitter_mobile: '9865432100', owner_name: 'Rajan Murugan', owner_mobile: '9865432100', survey_number: '89/1B', maps_link: '', doc_checklist: JSON.stringify({ 'Patta': 'Verified', 'Chitta': 'Received', 'FMB Sketch': 'Pending' }), photos: '[]', notes: '', created_by: 'dreamkey' }
    ]
  });

  await prisma.reDeal.createMany({
    data: [
      { title: 'Thirumangalam 3 Acre Deal', deal_type: 'Both Side Broker', status: 'Negotiation', property_type: 'Agricultural Land', district: 'Madurai', area: 'Thirumangalam', property_value: 4500000, seller_name: 'Rajan M', seller_mobile: '9865432100', buyer_name: 'Ganesh P', buyer_mobile: '9856781234', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 1.5, commission_rate_buyer: 1.0, commission_amount: 112500, commission_received: 0, token_amount: 0, follow_up_date: new Date(Date.now() + 2 * 86400000), notes: 'Both sides through us', documents: '[]', created_by: 'dreamkey' },
      { title: 'RS Puram Commercial Sale', deal_type: 'Buyer Side Only', status: 'Closed', property_type: 'Commercial Plot', district: 'Coimbatore', area: 'RS Puram', property_value: 7200000, seller_name: 'Suresh R', seller_mobile: '9845678901', buyer_name: 'Mohan K', buyer_mobile: '9834561234', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 0, commission_rate_buyer: 2.0, commission_amount: 144000, commission_received: 144000, token_amount: 500000, follow_up_date: null, notes: 'Completed successfully', documents: '[]', created_by: 'dreamkey' }
    ]
  });

  // ---------------------------------------------------------------------------
  // BUSINESS 3 - RTUROX TECH TRAINING SEED
  // ---------------------------------------------------------------------------
  console.log('Seeding RturoxAcademy Data...');

  await prisma.trainingCourse.createMany({
    data: [
      {
        course_name: 'Advanced React & TypeScript Architecture',
        platform: 'Rturox',
        category: 'Web Dev',
        status: 'In Progress',
        total_modules: 12,
        completed_modules: 8,
        start_date: new Date('2026-05-01'),
        target_completion_date: new Date('2026-06-15'),
        certificate_status: 'Pending',
        skill_tags: 'React 18,TypeScript,Zustand,TailwindCSS,Vite',
        resource_url: 'https://github.com/rturox/react-ts-arch',
        notes: 'Excellent deep dives into custom hook optimizations.',
        created_by: 'rturox_training'
      },
      {
        course_name: 'Full-Stack Machine Learning Pipelines',
        platform: 'Coursera',
        category: 'AI/ML',
        status: 'Not Started',
        total_modules: 20,
        completed_modules: 0,
        target_completion_date: new Date('2026-09-30'),
        certificate_status: 'Not Applicable',
        skill_tags: 'Python,Scikit-Learn,FastAPI,Docker,Pandas',
        notes: 'Covers end-to-end model tracking and artifact management.',
        created_by: 'rturox_training'
      },
      {
        course_name: 'NextJS Server Components Mastery',
        platform: 'Udemy',
        category: 'Web Dev',
        status: 'Completed',
        total_modules: 10,
        completed_modules: 10,
        start_date: new Date('2026-04-10'),
        target_completion_date: new Date('2026-05-10'),
        certificate_status: 'Uploaded',
        skill_tags: 'NextJS,React,Server Actions,Tailwind,Prisma',
        resource_url: 'https://udemy.com/nextjs-mastery-cert',
        notes: 'Completed ahead of schedule. Great understanding of caching levels.',
        created_by: 'rturox_training'
      }
    ]
  });

  await prisma.trainingStudent.createMany({
    data: [
      {
        student_name: 'Arun Mozhi',
        mobile: '918889991111',
        email: 'arun@training.com',
        course_enrolled: 'Advanced React & TypeScript Architecture',
        batch_name: 'React Batch A',
        enrollment_date: new Date('2026-05-02'),
        total_fee: 15000,
        status: 'Active',
        notes: 'Very diligent coder, answers quickly.',
        created_by: 'rturox_training'
      },
      {
        student_name: 'Deepika Padukone',
        mobile: '917776662222',
        email: 'deepika@training.com',
        course_enrolled: 'Advanced React & TypeScript Architecture',
        batch_name: 'React Batch A',
        enrollment_date: new Date('2026-05-03'),
        total_fee: 15000,
        status: 'Active',
        notes: 'Outstanding assignment submissions. Balance fee due next month.',
        created_by: 'rturox_training'
      },
      {
        student_name: 'Mohamed Ali',
        mobile: '919566123456',
        email: 'ali@training.com',
        course_enrolled: 'NextJS Server Components Mastery',
        batch_name: 'NextJS Batch 1',
        enrollment_date: new Date('2026-04-12'),
        total_fee: 18000,
        status: 'Completed',
        notes: 'Successfully finished the capstone portal.',
        created_by: 'rturox_training'
      }
    ]
  });

  await prisma.trainingBatch.createMany({
    data: [
      {
        batch_name: 'React Batch A',
        course_name: 'Advanced React & TypeScript Architecture',
        start_date: new Date('2026-05-05'),
        end_date: new Date('2026-07-05'),
        schedule_days: 'Mon,Wed,Fri',
        time_slot: '6:30 PM - 8:30 PM',
        capacity: 15,
        teacher_name: 'Suren Rturox',
        status: 'Active',
        created_by: 'rturox_training'
      },
      {
        batch_name: 'NextJS Batch 1',
        course_name: 'NextJS Server Components Mastery',
        start_date: new Date('2026-04-15'),
        end_date: new Date('2026-05-25'),
        schedule_days: 'Tue,Thu',
        time_slot: '8:00 PM - 10:00 PM',
        capacity: 10,
        teacher_name: 'Suren Rturox',
        status: 'Completed',
        created_by: 'rturox_training'
      }
    ]
  });

  await prisma.trainingStudyLog.createMany({
    data: [
      {
        log_date: new Date('2026-05-24'),
        course_name: 'Advanced React & TypeScript Architecture',
        hours_studied: 3.5,
        topics_covered: 'Component design models, absolute path configurations, and custom hook setups.',
        created_by: 'rturox_training'
      },
      {
        log_date: new Date('2026-05-25'),
        course_name: 'Advanced React & TypeScript Architecture',
        hours_studied: 2.0,
        topics_covered: 'Zustand global stores integration and state persistence configurations.',
        created_by: 'rturox_training'
      },
      {
        log_date: new Date('2026-05-26'),
        course_name: 'NextJS Server Components Mastery',
        hours_studied: 4.0,
        topics_covered: 'Studied NextJS database transactions, streaming suspense, and layout designs.',
        created_by: 'rturox_training'
      }
    ]
  });

  // ---------------------------------------------------------------------------
  // BUSINESS 4 - RTUROX COACHING CENTRE SEED
  // ---------------------------------------------------------------------------
  
  const arun = await prisma.trainingStudent.findFirst({ where: { student_name: 'Arun Mozhi' } });
  const deepika = await prisma.trainingStudent.findFirst({ where: { student_name: 'Deepika Padukone' } });
  const mohamed = await prisma.trainingStudent.findFirst({ where: { student_name: 'Mohamed Ali' } });

  if (arun) {
    await prisma.trainingFeeInstallment.create({
      data: {
        student_id: arun.student_id,
        amount: 15000,
        date: new Date('2026-05-02'),
        status: 'Paid',
        payment_mode: 'UPI',
        receipt_number: 'REC-001',
        created_by: 'rturox_training'
      }
    });
  }

  if (deepika) {
    await prisma.trainingFeeInstallment.create({
      data: {
        student_id: deepika.student_id,
        amount: 5000,
        date: new Date('2026-05-03'),
        status: 'Paid',
        payment_mode: 'Cash',
        receipt_number: 'REC-002',
        created_by: 'rturox_training'
      }
    });
  }

  if (mohamed) {
    await prisma.trainingFeeInstallment.create({
      data: {
        student_id: mohamed.student_id,
        amount: 18000,
        date: new Date('2026-04-12'),
        status: 'Paid',
        payment_mode: 'Bank Transfer',
        receipt_number: 'REC-003',
        created_by: 'rturox_training'
      }
    });
  }

  console.log('Seeding CKS Tuition Data...');

  // Create 10 sample coaching students across various standards
  const coachStudentsData = [
    { name: 'Karthikeyan G', standard: '10th', parentMobile: '919010203040', fee: 3500, dept: 'General' },
    { name: 'Priyanka Sen', standard: '12th', parentMobile: '919111222333', fee: 5000, dept: 'Science' },
    { name: 'Vijay Anand', standard: '12th', parentMobile: '919222333444', fee: 4800, dept: 'Commerce' },
    { name: 'Keerthana M', standard: '9th', parentMobile: '919333444555', fee: 3000, dept: 'General' },
    { name: 'Sanjith Kumar', standard: '8th', parentMobile: '919444555666', fee: 2500, dept: 'General' },
    { name: 'Rohan Sharma', standard: '11th', parentMobile: '919555666777', fee: 4500, dept: 'Science' },
    { name: 'Divya Nair', standard: '7th', parentMobile: '919666777888', fee: 2200, dept: 'General' },
    { name: 'Abhishek J', standard: '10th', parentMobile: '919777888999', fee: 3500, dept: 'General' },
    { name: 'Nisha Pillai', standard: '12th', parentMobile: '919888999000', fee: 4800, dept: 'Arts' },
    { name: 'Tejaswi Yadav', standard: '6th', parentMobile: '919999000111', fee: 2000, dept: 'General' },
  ];

  const studentMap: any = {};

  for (const stud of coachStudentsData) {
    // Generate subjects based on standard and department
    let subjects = '';
    if (stud.standard === '12th' && stud.dept === 'Science') {
      subjects = 'Physics,Chemistry,Maths,Biology,English,Tamil';
    } else if (stud.standard === '12th' && stud.dept === 'Commerce') {
      subjects = 'Accountancy,Economics,Commerce,Business Maths,English,Tamil';
    } else if (stud.standard === '12th' && stud.dept === 'Arts') {
      subjects = 'History,Geography,Political Science,Economics,English,Tamil';
    } else if (stud.standard === '11th') {
      subjects = 'Physics,Chemistry,Maths,Computer Science,English,Tamil';
    } else if (stud.standard === '9th' || stud.standard === '10th') {
      subjects = 'Tamil,English,Maths,Science,Social Science,Computer Science';
    } else {
      subjects = 'Tamil,English,Maths,Science,Social Science,Hindi';
    }

    const createdStudent = await prisma.coachingStudent.create({
      data: {
        student_name: stud.name,
        father_name: stud.name.split(' ')[0] + ' Father',
        mother_name: stud.name.split(' ')[0] + ' Mother',
        parent_mobile: stud.parentMobile,
        student_mobile: stud.parentMobile.slice(0, -3) + '789',
        standard: stud.standard,
        section: 'A',
        school_name: 'State Board Higher Secondary School',
        department: stud.dept,
        subjects_enrolled: subjects,
        enrollment_date: new Date('2026-01-10'),
        monthly_fee: stud.fee,
        status: 'Active',
        notes: 'Regular attendee, active in class discussions.',
        created_by: 'rturox_coaching'
      }
    });

    studentMap[stud.name] = createdStudent.student_id;

    // Seed Fee records for May 2026 (Paid) and June 2026 (Pending)
    await prisma.coachingFeeRecord.create({
      data: {
        student_id: createdStudent.student_id,
        month_year: 'May 2026',
        fee_amount: stud.fee,
        paid_date: new Date('2026-05-05'),
        payment_mode: 'UPI',
        receipt_number: `REC-2026-M${createdStudent.student_id.slice(0, 4)}`,
        status: 'Paid',
        notes: 'Paid via GPay.',
        created_by: 'rturox_coaching'
      }
    });

    // Make Nisha, Abhishek, Keerthana OVERDUE for May as well to trigger overdue flags
    if (['Nisha Pillai', 'Abhishek J', 'Keerthana M'].includes(stud.name)) {
      await prisma.coachingFeeRecord.updateMany({
        where: { student_id: createdStudent.student_id, month_year: 'May 2026' },
        data: { status: 'Overdue', paid_date: null, payment_mode: null, receipt_number: null }
      });
    }

    // June 2026 Pending
    await prisma.coachingFeeRecord.create({
      data: {
        student_id: createdStudent.student_id,
        month_year: 'June 2026',
        fee_amount: stud.fee,
        status: 'Pending',
        created_by: 'rturox_coaching'
      }
    });
  }

  await prisma.coachingBatch.createMany({
    data: [
      {
        batch_name: 'Secondary Science Batch',
        standard: '10th',
        subject: 'Science',
        teacher_name: 'Pradeep Swaminathan',
        schedule_days: 'Mon,Wed,Fri',
        time_slot: '5:00 PM - 6:30 PM',
        room_number: 'Room 102',
        capacity: 25,
        status: 'Active',
        created_by: 'rturox_coaching'
      },
      {
        batch_name: 'Higher Secondary Maths Batch',
        standard: '12th',
        subject: 'Maths',
        teacher_name: 'Manoharan Pillai',
        schedule_days: 'Tue,Thu,Sat',
        time_slot: '6:00 PM - 7:30 PM',
        room_number: 'Room 204',
        capacity: 20,
        status: 'Active',
        created_by: 'rturox_coaching'
      }
    ]
  });

  await prisma.coachingStaff.createMany({
    data: [
      {
        staff_name: 'Pradeep Swaminathan',
        mobile: '919940123456',
        email: 'pradeep@coaching.com',
        subject_specialization: 'Physics & Chemistry',
        standards_taught: '9th,10th,11th,12th',
        joining_date: new Date('2025-06-01'),
        monthly_salary: 22000,
        status: 'Active',
        notes: 'Highly rated by students for experimental physics.',
        created_by: 'rturox_coaching'
      },
      {
        staff_name: 'Manoharan Pillai',
        mobile: '919840123456',
        email: 'mano@coaching.com',
        subject_specialization: 'Mathematics',
        standards_taught: '10th,11th,12th',
        joining_date: new Date('2025-05-15'),
        monthly_salary: 25000,
        status: 'Active',
        notes: 'Ex-government school principal, strict discipline.',
        created_by: 'rturox_coaching'
      }
    ]
  });

  console.log('Seeding Coaching Exams & Results...');
  const mathExam = await prisma.coachingExam.create({
    data: {
      exam_name: 'Unit Test 1',
      standard: '12th',
      subject: 'Maths',
      exam_date: new Date('2026-05-10'),
      total_marks: 100,
      created_by: 'rturox_coaching'
    }
  });

  const scienceExam = await prisma.coachingExam.create({
    data: {
      exam_name: 'Unit Test 1',
      standard: '10th',
      subject: 'Science',
      exam_date: new Date('2026-05-12'),
      total_marks: 100,
      created_by: 'rturox_coaching'
    }
  });

  // Seed results for 12th standard students (Priyanka, Vijay, Nisha)
  await prisma.coachingResult.createMany({
    data: [
      {
        exam_id: mathExam.exam_id,
        student_id: studentMap['Priyanka Sen'],
        marks_scored: 92, // A+
        created_by: 'rturox_coaching'
      },
      {
        exam_id: mathExam.exam_id,
        student_id: studentMap['Vijay Anand'],
        marks_scored: 78, // B
        created_by: 'rturox_coaching'
      },
      {
        exam_id: mathExam.exam_id,
        student_id: studentMap['Nisha Pillai'],
        marks_scored: 44, // F (pass criteria is 35, so Pass but grade F)
        created_by: 'rturox_coaching'
      }
    ]
  });

  // Seed results for 10th standard students (Karthikeyan, Abhishek)
  await prisma.coachingResult.createMany({
    data: [
      {
        exam_id: scienceExam.exam_id,
        student_id: studentMap['Karthikeyan G'],
        marks_scored: 88, // A
        created_by: 'rturox_coaching'
      },
      {
        exam_id: scienceExam.exam_id,
        student_id: studentMap['Abhishek J'],
        marks_scored: 62, // C
        created_by: 'rturox_coaching'
      }
    ]
  });

  console.log('Database Seeding Completed Successfully! All 4 business dashboards loaded.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
