import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const wos = await prisma.workOrder.findMany();
  console.log('Work Orders in DB:', wos.length);
}
main().finally(async () => { await prisma.(); });
