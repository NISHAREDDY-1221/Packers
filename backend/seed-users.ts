import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Operator and QC users...');

  const opRole = await prisma.role.upsert({
    where: { name: 'OPERATOR' },
    update: {},
    create: {
      name: 'OPERATOR',
      description: 'Packing Operator',
      permissions: ['PACKING']
    }
  });

  const qcRole = await prisma.role.upsert({
    where: { name: 'QC_CHECKER' },
    update: {},
    create: {
      name: 'QC_CHECKER',
      description: 'Quality Control',
      permissions: ['QC']
    }
  });

  const pwd = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'operator@villagkart.com' },
    update: {},
    create: {
      email: 'operator@villagkart.com',
      password: pwd,
      name: 'Test Operator',
      roleId: opRole.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'qc@villagkart.com' },
    update: {},
    create: {
      email: 'qc@villagkart.com',
      password: pwd,
      name: 'Test QC',
      roleId: qcRole.id
    }
  });

  console.log('Users created successfully.');
  console.log('Operator: operator@villagkart.com / password123');
  console.log('QC Checker: qc@villagkart.com / password123');
}

main().finally(() => prisma.$disconnect());
