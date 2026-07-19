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
    
    // Map data to match frontend requirements
    return approvals.map((app: any) => ({
      ...app,
      requestedBy: app.requestedBy.name,
      history: app.history.map((h: any) => ({
        ...h,
        actionBy: h.actionBy.name,
      }))
    }));
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

      return {
        ...updatedApproval,
        requestedBy: updatedApproval.requestedBy.name,
        history: history.map((h: any) => ({ ...h, actionBy: h.actionBy.name }))
      };
    });
  }
}
