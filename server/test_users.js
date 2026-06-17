const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ select: { id: true, userId: true, deletedAt: true } });
  console.log("Users:", users);
}
run().catch(console.error).finally(() => prisma.$disconnect());
