const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const missingEnums = [
  'PENDING_APPROVAL',
  'PACKING_COMPLETED',
  'LABELS_GENERATED',
  'LABELS_PRINTED',
  'QC_IN_PROGRESS',
  'QC_FAILED',
  'REPACKING',
  'FINISHED_GOODS'
];

async function main() {
  try {
    for (const status of missingEnums) {
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
