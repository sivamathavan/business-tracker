const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log("All users:", users.length);
  
  // Find a user to delete
  let target = users.find(u => u.userId === 'mathavan');
  if (!target) {
    target = await prisma.user.create({
      data: {
        userId: 'test_delete_1',
        passcodeHash: 'xxx',
        role: 'USER'
      }
    });
  }
  
  console.log("Target to delete:", target.id);
  
  const res = await prisma.user.update({
    where: { id: target.id },
    data: { deletedAt: new Date() }
  });
  console.log("Delete result:", res.deletedAt !== null);
  
  const activeUsers = await prisma.user.findMany({ where: { deletedAt: null } });
  console.log("Active users count:", activeUsers.length);
}

run().catch(console.error).finally(() => prisma.$disconnect());
