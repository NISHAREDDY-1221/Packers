import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/error';
import { APIFeatures } from '../utils/apiFeatures';

export class WorkflowService {
  // --- Quality Check ---
  static async getQualityChecks(queryString: any = {}) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['qcNumber', 'result'])
      .sort()
      .paginate();

    apiFeatures.query = { 
      ...apiFeatures.query, 
      include: { workOrder: true, inspector: true } 
    };

    const [qcs, total] = await Promise.all([
      prisma.qualityCheck.findMany(apiFeatures.query),
      prisma.qualityCheck.count({ where: apiFeatures.query.where })
    ]);

    return { data: qcs, total, page: apiFeatures.queryString.page || 1 };
  }

  static async submitQualityCheck(data: { woId: string; checkedQty: number; result: any; severity?: any; failureReason?: string; remarks?: string; checksPayload: any; inspectorId: string }) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id: data.woId } });
    if (!workOrder) throw new AppError(404, 'Work Order not found');

    if (workOrder.status !== 'PACKING_STARTED' && workOrder.status !== 'QC_PENDING') {
      throw new AppError(400, 'Quality Check can only be performed on Work Orders that have started packing');
    }

    const qcNumber = `QC-${Date.now().toString().slice(-6)}`;
    
    return await prisma.$transaction(async (tx: any) => {
      const qc = await tx.qualityCheck.create({
        data: {
          qcNumber,
          woId: data.woId,
          inspectorId: data.inspectorId,
          checkedQty: data.checkedQty,
          result: data.result,
          severity: data.severity,
          failureReason: data.failureReason,
          remarks: data.remarks,
          checksPayload: data.checksPayload,
        }
      });

      const newStatus = (data.result === 'PASS' || data.result === 'PARTIAL_PASS') ? 'QC_PASSED' : 'QC_PENDING';
      
      const updatedWO = await tx.workOrder.update({
        where: { id: data.woId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          userId: data.inspectorId,
          action: 'SUBMIT_QC',
          entity: 'QualityCheck',
          entityId: qc.id,
          newData: JSON.parse(JSON.stringify(qc)),
        }
      });

      return { qc, updatedWO };
    });
  }

  // --- Finished Goods ---
  static async postFinishedGoods(data: { woId: string; batchNumber: string; postedQty: number; destination: string; userId: string }) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id: data.woId }, include: { product: true } });
    if (!workOrder) throw new AppError(404, 'Work Order not found');

    if (workOrder.status !== 'QC_PASSED') {
      throw new AppError(400, 'Only QC Passed batches can be posted to Finished Goods');
    }

    const fgNumber = `FG-${Date.now().toString().slice(-6)}`;

    return await prisma.$transaction(async (tx: any) => {
      const fg = await tx.finishedGoods.create({
        data: {
          fgNumber,
          woId: data.woId,
          productId: workOrder.productId,
          batchNumber: data.batchNumber,
          postedQty: data.postedQty,
          destination: data.destination,
        }
      });

      const updatedWO = await tx.workOrder.update({
        where: { id: data.woId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          actualProduced: data.postedQty,
          batchNumber: data.batchNumber, // Assign final batch number
        },
      });

      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: 'POST_FINISHED_GOODS',
          entity: 'FinishedGoods',
          entityId: fg.id,
          newData: JSON.parse(JSON.stringify(fg)),
        }
      });

      return { fg, updatedWO };
    });
  }

  // --- Repacking ---
  static async logRepacking(data: { sourceWoId: string; repackType: string; recoverableQty: number; wasteQty: number; targetRecipeId?: string; userId: string }) {
    const sourceWO = await prisma.workOrder.findUnique({ 
      where: { id: data.sourceWoId },
      include: { qualityChecks: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!sourceWO) throw new AppError(404, 'Source Work Order not found');

    // Must have a failed QC to be repacked
    const latestQC = sourceWO.qualityChecks[0];
    if (!latestQC || (latestQC.result === 'PASS' || latestQC.result === 'PARTIAL_PASS')) {
      throw new AppError(400, 'Only QC Failed or Rework batches can be repacked');
    }

    const rpNumber = `RP-${Date.now().toString().slice(-6)}`;
    const newBatchNumber = `BATCH-RP-${Date.now().toString().slice(-6)}`;

    return await prisma.$transaction(async (tx: any) => {
      const repackLog = await tx.repackingLog.create({
        data: {
          rpNumber,
          sourceWoId: data.sourceWoId,
          repackType: data.repackType,
          recoverableQty: data.recoverableQty,
          wasteQty: data.wasteQty,
          newBatchNumber,
          targetRecipeId: data.targetRecipeId,
          loggedById: data.userId,
        }
      });

      // Mark original WO as completed but with actual rejected/waste values
      await tx.workOrder.update({
        where: { id: data.sourceWoId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          actualProduced: 0,
          actualRejected: data.wasteQty + data.recoverableQty,
        },
      });

      // Generate New Work Order for the Recovered Quantity to go through the cycle again
      const newWO = await tx.workOrder.create({
        data: {
          woNumber: `WO-${Date.now().toString().slice(-6)}`,
          productId: sourceWO.productId,
          recipeId: data.targetRecipeId || sourceWO.recipeId,
          requiredQty: data.recoverableQty,
          priority: 'URGENT',
          status: 'DRAFT',
          supervisorId: data.userId,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: 'LOG_REPACKING',
          entity: 'RepackingLog',
          entityId: repackLog.id,
          newData: JSON.parse(JSON.stringify(repackLog)),
        }
      });

      return { repackLog, newWO };
    });
  }
}
