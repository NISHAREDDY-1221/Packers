import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator',
      permissions: ['ALL'],
    },
  });

  const operatorRole = await prisma.role.upsert({
    where: { name: 'OPERATOR' },
    update: {},
    create: {
      name: 'OPERATOR',
      description: 'Packing Operator',
      permissions: ['PACKING'],
    },
  });

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@villagkart.com' },
    update: {},
    create: {
      email: 'admin@villagkart.com',
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id,
    },
  });

  // 3. Create Operators
  const operator1 = await prisma.user.upsert({
    where: { email: 'suresh@villagkart.com' },
    update: {},
    create: {
      email: 'suresh@villagkart.com',
      password: hashedPassword,
      name: 'Suresh Kumar',
      roleId: operatorRole.id,
    },
  });

  const operator2 = await prisma.user.upsert({
    where: { email: 'ramesh@villagkart.com' },
    update: {},
    create: {
      email: 'ramesh@villagkart.com',
      password: hashedPassword,
      name: 'Ramesh Singh',
      roleId: operatorRole.id,
    },
  });

  console.log('Seeding complete! Admin User and Operators created.');
  console.log('Email: admin@villagkart.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
