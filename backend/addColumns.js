const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "WorkOrder" ADD COLUMN "labelsPrinted" DOUBLE PRECISION NOT NULL DEFAULT 0;');
    console.log('Added labelsPrinted');
  } catch (e) {
    console.error(e.message);
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "WorkOrder" ADD COLUMN "labelsApplied" DOUBLE PRECISION NOT NULL DEFAULT 0;');
    console.log('Added labelsApplied');
  } catch (e) {
    console.error(e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
