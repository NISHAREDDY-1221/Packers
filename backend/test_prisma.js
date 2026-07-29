const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const wos = await prisma.workOrder.findMany({ take: 1 });
    if (wos.length > 0) {
      await prisma.workOrder.update({
        where: { id: wos[0].id },
        data: { labelsPrinted: 10 }
      });
      console.log('Update successful');
    } else {
      console.log('No work orders');
    }
  } catch (err) {
    console.error('Update failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
