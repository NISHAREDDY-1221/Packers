const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newEnums = [
  'LABEL_APPLICATION_ASSIGNED',
  'LABEL_APPLICATION_IN_PROGRESS',
  'LABELS_APPLIED'
];

async function main() {
  try {
    for (const status of newEnums) {
      await prisma.$executeRawUnsafe(`ALTER TYPE "WoStatus" ADD VALUE IF NOT EXISTS '${status}'`);
      console.log(`Added ${status}`);
    }
    console.log('All missing enums added successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
