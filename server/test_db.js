const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const t0 = Date.now();
  console.log("Counting TechProjects...", await prisma.techProject.count());
  console.log("Counting ReDeals...", await prisma.reDeal.count());
  console.log("Counting CoachingFeeRecords...", await prisma.coachingFeeRecord.count());
  console.log("Time:", Date.now() - t0, "ms");
}
run().catch(console.error).finally(() => prisma.$disconnect());
