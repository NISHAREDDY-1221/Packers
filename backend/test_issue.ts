import { PrismaClient } from '@prisma/client';
import { WorkOrderService } from './src/services/workOrderService';

const prisma = new PrismaClient();

async function run() {
  try {
    const wo = await prisma.workOrder.findFirst({ where: { status: 'APPROVED' } });
    if (!wo) {
      console.log('No approved WO found');
      return;
    }
    console.log('Found WO:', wo.id);
    const result = await WorkOrderService.issueMaterials(wo.id, { test: 1 }, wo.supervisorId);
    console.log('Success:', result);
  } catch(e) {
    console.error('Error in issueMaterials:', e);
  }
}
run();
