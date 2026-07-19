import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  
  const wos = await prisma.workOrder.findMany();
  console.log('WorkOrders:', wos);
  
  const mis = await prisma.materialIssue.findMany();
  console.log('MaterialIssues:', mis);
}
run();
