import { prisma } from '../utils/prisma';

export class ApprovalService {
  static async getApprovals(query: any) {
    const { status, type, searchTerm } = query;

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
    
    const woIds = approvals.filter((a: any) => a.type === 'WORK_ORDER').map((a: any) => a.relatedEntityId);
    let workOrders: any[] = [];
    if (woIds.length > 0) {
      workOrders = await prisma.workOrder.findMany({
        where: { id: { in: woIds } },
        include: { product: true, operator: true, supervisor: true }
      });
    }

    // Map data to match frontend requirements
    return approvals.map((app: any) => {
      let finalEntityName = app.relatedEntityName;
      let actualRequestedBy = app.requestedBy.name;

      if (app.type === 'WORK_ORDER') {
        const wo = workOrders.find(w => w.id === app.relatedEntityId);
        if (wo && wo.product) {
          finalEntityName = `${app.relatedEntityName} (${wo.product.name})`;
        }
        if (wo && wo.operator) {
          actualRequestedBy = wo.operator.name;
        } else if (wo && wo.supervisor) {
          actualRequestedBy = wo.supervisor.name;
        }
      }

      return {
        ...app,
        relatedEntityName: finalEntityName,
        requestedDate: app.createdAt,
        requestedBy: actualRequestedBy,
        history: app.history.map((h: any) => ({
          ...h,
          actionBy: h.actionBy.name,
        }))
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
          data: { status: action === 'APPROVE' ? 'APPROVED' : 'DRAFT' }
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

      let finalEntityName = updatedApproval.relatedEntityName;
      let actualRequestedBy = updatedApproval.requestedBy.name;

      if (updatedApproval.type === 'WORK_ORDER') {
        const wo = await tx.workOrder.findUnique({
          where: { id: updatedApproval.relatedEntityId },
          include: { product: true, operator: true, supervisor: true }
        });
        if (wo && wo.product) {
          finalEntityName = `${updatedApproval.relatedEntityName} (${wo.product.name})`;
        }
        if (wo && wo.operator) {
          actualRequestedBy = wo.operator.name;
        } else if (wo && wo.supervisor) {
          actualRequestedBy = wo.supervisor.name;
        }
      }

      return {
        ...updatedApproval,
        relatedEntityName: finalEntityName,
        requestedDate: updatedApproval.createdAt,
        requestedBy: actualRequestedBy,
        history: history.map((h: any) => ({ ...h, actionBy: h.actionBy.name }))
      };
    });
  }
}
