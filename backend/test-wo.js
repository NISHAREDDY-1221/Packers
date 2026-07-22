const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.workOrder.findMany().then(wos => console.log(wos)).catch(console.error).finally(() => prisma.$disconnect());
