
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wos = await prisma.workOrder.findMany();
  console.log(wos);
}
main().finally(() => prisma.());
