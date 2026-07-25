import { prisma } from './src/utils/prisma';

async function sync() {
  const pendingWOs = await prisma.workOrder.findMany({
    where: { status: 'PENDING' }
  });

  for (const wo of pendingWOs) {
    const existing = await prisma.approvalRequest.findFirst({
      where: { relatedEntityId: wo.id }
    });

    if (!existing) {
      console.log(`Creating ApprovalRequest for WO ${wo.woNumber}`);
      await prisma.approvalRequest.create({
        data: {
          type: 'WORK_ORDER',
          relatedEntityId: wo.id,
          relatedEntityName: `Work Order #${wo.woNumber}`,
          requestedById: wo.supervisorId, // Using supervisorId as fallback
          reason: 'Submit for approval (retroactive)',
          priority: wo.priority as any,
          status: 'PENDING',
        }
      });
    }
  }
  console.log('Sync complete');
}

sync().catch(console.error).finally(() => prisma.$disconnect());
