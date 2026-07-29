const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "WoStatus" ADD VALUE IF NOT EXISTS 'PACKING_IN_PROGRESS'`);
    console.log('Enum value added successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
