import { prisma } from '../utils/prisma';

export class ApprovalService {
  static async getApprovals(query: any) {
    const { status, type, searchTerm } = query;

    // Auto-sync: Ensure any WorkOrder with status PENDING has an ApprovalRequest record
    const pendingWOs = await prisma.workOrder.findMany({
      where: { status: 'PENDING' },
      include: { product: true, supervisor: true }
    });

    for (const wo of pendingWOs) {
      const existing = await prisma.approvalRequest.findFirst({
        where: { type: 'WORK_ORDER', relatedEntityId: wo.id, status: 'PENDING' }
      });
      if (!existing) {
        await prisma.approvalRequest.create({
          data: {
            type: 'WORK_ORDER',
            relatedEntityId: wo.id,
            relatedEntityName: wo.woNumber,
            requestedById: wo.supervisorId,
            reason: `Work order authorization and stock check approval for ${wo.woNumber}`,
            priority: wo.priority,
            status: 'PENDING',
          }
        });
      }
    }

    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (searchTerm) {
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { relatedEntityName: { contains: searchTerm, mode: 'insensitive' } },
        { requestedBy: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        requestedBy: true,
        history: {
          include: {
            actionBy: true,
          },
          orderBy: {
            actionDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Fetch related Work Orders with recipe and product stock data
    const woIds = approvals.filter((a: any) => a.type === 'WORK_ORDER' && a.relatedEntityId).map((a: any) => a.relatedEntityId);
    const workOrders = woIds.length > 0 ? await prisma.workOrder.findMany({
      where: { id: { in: woIds } },
      include: { 
        product: { include: { uom: true } },
        recipe: {
          include: {
            items: {
              include: {
                inputProduct: { include: { uom: true } }
              }
            }
          }
        },
        supervisor: true
      }
    }) : [];

    const woMap = new Map(workOrders.map((w: any) => [w.id, w]));
    
    // Map data to match frontend requirements
    return approvals.map((app: any) => {
      const wo: any = woMap.get(app.relatedEntityId);

      let inventoryStatus = 'NOT_CHECKED';
      let inventoryValidation: any[] = [];
      let woDetails: any = null;

      if (wo) {
        const requiredWoQty = wo.requiredQty || 100;
        const recipeOutputQty = wo.recipe?.outputQty || 1;
        let totalShortageCount = 0;

        if (wo.recipe?.items && wo.recipe.items.length > 0) {
          inventoryValidation = wo.recipe.items.map((item: any) => {
            const reqQty = Math.round(((requiredWoQty * item.requiredQty) / recipeOutputQty) * 100) / 100;
            const availStock = item.inputProduct?.availableStock ?? 0;
            const shortage = Math.max(0, reqQty - availStock);

            if (shortage > 0) totalShortageCount++;

            const isPkg = item.isPackaging || item.inputProduct?.type === 'PACKAGING';

            return {
              id: item.id,
              materialName: item.inputProduct?.name || 'Unknown Material',
              type: isPkg ? 'PACKAGING' : 'RAW_MATERIAL',
              requiredQty: reqQty,
              uom: item.inputProduct?.uom?.abbreviation || item.inputProduct?.uom?.name || (isPkg ? 'PCS' : 'KG'),
              availableStock: availStock,
              shortage: shortage,
              status: shortage > 0 ? 'INSUFFICIENT' : 'AVAILABLE'
            };
          });

          inventoryStatus = totalShortageCount > 0 ? 'STOCK_SHORTAGE' : 'STOCK_AVAILABLE';
        }

        woDetails = {
          woNumber: wo.woNumber,
          outputProduct: wo.product?.name || 'Standard Product',
          recipeCode: wo.recipe?.code || 'REC-DEFAULT',
          targetQty: wo.requiredQty,
          targetYieldQty: recipeOutputQty,
          uomName: wo.product?.uom?.name || wo.product?.uom?.abbreviation || 'Pack',
          requestedBy: wo.supervisor?.name || app.requestedBy?.name || 'Supervisor',
          requestedDate: wo.createdAt || app.requestedDate,
          priority: wo.priority,
          status: wo.status
        };
      }

      return {
        ...app,
        productName: app.productName || woDetails?.outputProduct || 'Standard Product',
        requestedBy: app.requestedBy?.name || woDetails?.requestedBy || 'Unknown',
        history: app.history.map((h: any) => ({
          ...h,
          actionBy: h.actionBy?.name || 'System',
        })),
        inventoryStatus,
        inventoryValidation,
        woDetails
      };
    });
  }

  static async processApproval(id: string, action: 'APPROVE' | 'REJECT', userId: string, comments?: string) {
    const approval = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!approval) throw new Error('Approval not found');
    if (approval.status !== 'PENDING') throw new Error('Approval is no longer pending');

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    return await prisma.$transaction(async (tx: any) => {
      const updatedApproval = await tx.approvalRequest.update({
        where: { id },
        data: { status: newStatus },
        include: {
          requestedBy: true
        }
      });

      if (updatedApproval.type === 'WORK_ORDER') {
        await tx.workOrder.update({
          where: { id: updatedApproval.relatedEntityId },
          data: { status: action === 'APPROVE' ? 'APPROVED' : 'CANCELLED' }
        });
      }

      await tx.approvalHistory.create({
        data: {
          approvalRequestId: id,
          action: action === 'APPROVE' ? 'Approved' : 'Rejected',
          actionById: userId,
          comments,
        },
      });
      
      const history = await tx.approvalHistory.findMany({
        where: { approvalRequestId: id },
        include: { actionBy: true },
        orderBy: { actionDate: 'asc' }
      });

      return {
        ...updatedApproval,
        requestedBy: updatedApproval.requestedBy?.name || 'Unknown',
        history: history.map((h: any) => ({ ...h, actionBy: h.actionBy?.name || 'System' }))
      };
    }, {
      maxWait: 15000, // 15 seconds
      timeout: 30000, // 30 seconds
    });
  }
}
