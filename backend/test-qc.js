const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.qualityCheck.findMany().then(qcs => console.log(qcs)).catch(console.error).finally(() => prisma.$disconnect());
