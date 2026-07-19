import { PrismaClient } from '@prisma/client';
import { WorkOrderService } from './src/services/workOrderService';

const prisma = new PrismaClient();

async function run() {
  try {
    let wo = await prisma.workOrder.findFirst();
    if (!wo) {
      console.log('No WO found at all');
      return;
    }
    await prisma.workOrder.update({ where: { id: wo.id }, data: { status: 'APPROVED' } });
    
    console.log('Found/Updated WO:', wo.id);
    const result = await WorkOrderService.issueMaterials(wo.id, { test: 1 }, wo.supervisorId);
    console.log('Success:', result);
  } catch(e) {
    console.error('Error in issueMaterials:', e);
  }
}
run();
