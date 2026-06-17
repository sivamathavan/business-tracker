import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.user.count();
  console.log("Total users:", count);
  const users = await prisma.user.findMany({ select: { userId: true }});
  console.log("User IDs:", users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
