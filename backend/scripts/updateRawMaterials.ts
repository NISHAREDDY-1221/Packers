import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.product.updateMany({
    where: {
      type: { notIn: ['PACKAGING', 'FINISHED_GOOD'] }
    },
    data: {
      type: 'RAW_MATERIAL'
    }
  });
  console.log("Updated products to RAW_MATERIAL");
}
main().finally(() => prisma.$disconnect());
