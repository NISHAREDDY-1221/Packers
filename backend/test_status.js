const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRaw`SELECT DISTINCT status FROM "WorkOrder"`.then(res => console.log(res)).catch(e => console.error(e)).finally(() => prisma.$disconnect());
