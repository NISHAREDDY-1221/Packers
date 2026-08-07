import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const recipes = await prisma.recipe.findMany();
  const outputProductIds = recipes.map(r => r.outputProductId);
  
  await prisma.product.updateMany({
    where: {
      id: { in: outputProductIds }
    },
    data: {
      type: 'FINISHED_GOOD'
    }
  });
  console.log("Updated output products to FINISHED_GOOD");
}
main().finally(() => prisma.$disconnect());
