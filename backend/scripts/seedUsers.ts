import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure Roles exist
  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator',
        permissions: ['ALL']
      }
    });
  }

  let operatorRole = await prisma.role.findUnique({ where: { name: 'OPERATOR' } });
  if (!operatorRole) {
    operatorRole = await prisma.role.create({
      data: {
        name: 'OPERATOR',
        description: 'Packing Operator',
        permissions: ['READ_WORK_ORDER', 'UPDATE_WORK_ORDER']
      }
    });
  }

  let qcRole = await prisma.role.findUnique({ where: { name: 'QC' } });
  if (!qcRole) {
    qcRole = await prisma.role.create({
      data: {
        name: 'QC',
        description: 'Quality Control Checker',
        permissions: ['READ_WORK_ORDER', 'QC_APPROVE']
      }
    });
  }

  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // Upsert Admin
  await prisma.user.upsert({
    where: { email: 'admin@villagkart.com' },
    update: { password: adminPasswordHash, roleId: adminRole.id },
    create: {
      email: 'admin@villagkart.com',
      name: 'Admin User',
      password: adminPasswordHash,
      roleId: adminRole.id
    }
  });
  console.log('Admin user seeded: admin@villagkart.com');

  // Upsert Operator
  await prisma.user.upsert({
    where: { email: 'operator@villagkart.com' },
    update: { password: passwordHash, roleId: operatorRole.id },
    create: {
      email: 'operator@villagkart.com',
      name: 'Test Operator',
      password: passwordHash,
      roleId: operatorRole.id
    }
  });
  console.log('Operator user seeded: operator@villagkart.com');

  // Upsert QC
  await prisma.user.upsert({
    where: { email: 'qc@villagkart.com' },
    update: { password: passwordHash, roleId: qcRole.id },
    create: {
      email: 'qc@villagkart.com',
      name: 'Test QC',
      password: passwordHash,
      roleId: qcRole.id
    }
  });
  console.log('QC user seeded: qc@villagkart.com');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
