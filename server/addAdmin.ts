import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = bcrypt.genSaltSync(10);
  
  // Check if admin exists
  let admin = await prisma.user.findFirst({ where: { userId: 'admin' } });
  
  if (admin) {
    console.log('Admin already exists. Updating passcode to 123456');
    await prisma.user.update({
      where: { id: admin.id },
      data: { passcodeHash: bcrypt.hashSync('123456', salt) }
    });
  } else {
    console.log('Admin does not exist. Creating admin user...');
    await prisma.user.create({
      data: {
        userId: 'admin',
        passcodeHash: bcrypt.hashSync('123456', salt),
        role: 'ADMIN',
      }
    });
  }
  
  // Also recreate dkproperties if passcode was messed up
  const dk = await prisma.user.findFirst({ where: { userId: 'dkproperties' } });
  if (dk) {
    await prisma.user.update({
      where: { id: dk.id },
      data: { passcodeHash: bcrypt.hashSync('222222', salt) }
    });
  }
}

main()
  .then(() => console.log('Successfully updated admin!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
