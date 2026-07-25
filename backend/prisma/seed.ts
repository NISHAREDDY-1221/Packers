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

  const qcRole = await prisma.role.upsert({
    where: { name: 'QC_INSPECTOR' },
    update: {},
    create: {
      name: 'QC_INSPECTOR',
      description: 'Quality Control Inspector',
      permissions: ['QC'],
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

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@villagkart.com' },
    update: {},
    create: {
      email: 'operator@villagkart.com',
      password: hashedPassword,
      name: 'Packing Operator',
      roleId: operatorRole.id,
    },
  });

  const qcUser = await prisma.user.upsert({
    where: { email: 'qc@villagkart.com' },
    update: {},
    create: {
      email: 'qc@villagkart.com',
      password: hashedPassword,
      name: 'QC Inspector',
      roleId: qcRole.id,
    },
  });

  console.log('Seeding complete! Users created.');
  console.log('Admin: admin@villagkart.com');
  console.log('Operator: operator@villagkart.com');
  console.log('QC: qc@villagkart.com');
  console.log('Password for all: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
