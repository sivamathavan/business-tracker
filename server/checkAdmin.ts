import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findFirst({ where: { userId: 'admin' } });
  console.log("Admin record:", admin);
}
main().finally(() => prisma.$disconnect());
