import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getPrintHistory = catchAsync(async (req: Request, res: Response) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const history = await prisma.labelPrintJob.findMany({
    where: {
      createdAt: {
        gte: oneDayAgo,
      },
    },
    include: {
      WorkOrder: {
        include: {
          product: true,
        },
      },
      User: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formatted = history.map((job: any) => ({
    id: job.id,
    woNo: job.WorkOrder?.woNumber || 'Unknown',
    sku: job.WorkOrder?.product?.sku || 'Unknown',
    batchNo: job.batchNumber,
    printedQty: job.printedQty,
    printedBy: job.User?.name || 'Unknown',
    status: job.status,
    timestamp: job.createdAt,
    reprintReason: job.reprintReason,
    printer: job.printer || 'Zebra ZD420 (Thermal)',
  }));

  res.status(200).json({ success: true, data: formatted });
});

export const printLabels = catchAsync(async (req: Request, res: Response) => {
  const { workOrderId, batchNumber, barcodeType, printedQty, operatorId, printer, labelTemplate } = req.body;
  const userId = req.user!.id;

  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Create the PrintJob
    const job = await tx.labelPrintJob.create({
      data: {
        workOrderId,
        batchNumber,
        barcodeType,
        printedQty,
        printedById: userId,
        status: 'Printed',
        type: 'INITIAL',
        printer: printer || 'Unknown',
        labelTemplate: labelTemplate || 'Retail Label',
      },
      include: {
        WorkOrder: {
          include: {
            product: true,
          },
        },
        User: true,
      },
    });

    // 2. Create the LabelApplicationTask
    const task = await tx.labelApplicationTask.create({
      data: {
        woId: workOrderId,
        printJobId: job.id,
        operatorId: operatorId || userId, // fallback if not provided
        assignedById: userId,
        requiredQuantity: job.WorkOrder.actualProduced || job.WorkOrder.requiredQty,
        appliedQuantity: 0,
        remainingQuantity: job.WorkOrder.actualProduced || job.WorkOrder.requiredQty,
        status: 'ASSIGNED',
      }
    });

    // 3. Update the WorkOrder status and assignments
    await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'LABEL_APPLICATION_ASSIGNED',
        labelsPrinted: { increment: printedQty },
        operatorId: operatorId || userId,
      }
    });

    return { job, task };
  });

  const { job } = result;

  const formatted = {
    id: job.id,
    woNo: job.WorkOrder.woNumber,
    sku: job.WorkOrder.product.sku,
    batchNo: job.batchNumber,
    printedQty: job.printedQty,
    printedBy: job.User.name,
    status: job.status,
    timestamp: job.createdAt,
    reprintReason: job.reprintReason,
  };

  res.status(201).json({ success: true, data: formatted });
});

export const reprintLabels = catchAsync(async (req: Request, res: Response) => {
  const { jobId, reprintReason, printedQty } = req.body;
  const userId = req.user!.id;

  const originalJob = await prisma.labelPrintJob.findUnique({
    where: { id: jobId },
    include: { WorkOrder: true },
  });

  if (!originalJob) {
    return res.status(404).json({ success: false, message: 'Original print job not found' });
  }

  const reprintQty = printedQty || originalJob.printedQty;

  // If reprint qty > 100, create approval request instead of immediate reprint
  if (reprintQty > 100) {
    const approval = await prisma.approvalRequest.create({
      data: {
        type: 'BARCODE_REPRINT',
        relatedEntityId: originalJob.workOrderId,
        relatedEntityName: `Work Order #${originalJob.WorkOrder.woNumber} - Barcode Reprint`,
        requestedById: userId,
        reason: reprintReason || 'Reprint requires approval due to high quantity',
        priority: 'MEDIUM',
        status: 'PENDING',
        proposedValues: {
          jobId: originalJob.id,
          reprintQty: reprintQty,
          reason: reprintReason,
        }
      },
    });
    return res.status(202).json({
      success: true,
      message: 'Approval request raised for reprint',
      requiresApproval: true,
      approvalId: approval.id,
    });
  }

  const result = await prisma.$transaction(async (tx: any) => {
    // If <= 100, create reprint directly
    const job = await tx.labelPrintJob.create({
      data: {
        workOrderId: originalJob.workOrderId,
        batchNumber: originalJob.batchNumber,
        barcodeType: originalJob.barcodeType,
        printedQty: reprintQty,
        printedById: userId,
        status: 'Reprinted',
        reprintReason,
        type: 'REPRINT',
        printer: originalJob.printer,
        labelTemplate: originalJob.labelTemplate,
      },
      include: {
        WorkOrder: {
          include: {
            product: true,
          },
        },
        User: true,
      },
    });

    // We do NOT increment the LabelApplicationTask requiredQuantity.
    // It stays the same because reprint is just replacing labels, not adding to packed products.
    // However, we do update WorkOrder labelsPrinted to keep a total count.
    await tx.workOrder.update({
      where: { id: originalJob.workOrderId },
      data: {
        labelsPrinted: { increment: reprintQty },
      }
    });

    return job;
  });

  const formatted = {
    id: result.id,
    woNo: result.WorkOrder.woNumber,
    sku: result.WorkOrder.product.sku,
    batchNo: result.batchNumber,
    printedQty: result.printedQty,
    printedBy: result.User.name,
    status: result.status,
    timestamp: result.createdAt,
    reprintReason: result.reprintReason,
  };

  res.status(201).json({ success: true, data: formatted, requiresApproval: false });
});

export const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const tasks = await prisma.labelApplicationTask.findMany({
    where: {
      operatorId: userId,
      status: {
        in: ['ASSIGNED', 'IN_PROGRESS', 'ISSUE_REPORTED']
      }
    },
    include: {
      workOrder: {
        include: { product: true }
      },
      printJob: true
    },
    orderBy: {
      assignedAt: 'desc'
    }
  });

  // Map to match the frontend expectations for tasks
  const formattedTasks = tasks.map((t: any) => ({
    id: t.workOrder.id, // Using WO ID to match frontend behavior which expects a work order
    woNumber: t.workOrder.woNumber,
    product: t.workOrder.product,
    status: t.workOrder.status,
    priority: t.workOrder.priority,
    requiredQty: t.requiredQuantity,
    actualProduced: t.workOrder.actualProduced,
    labelsApplied: t.appliedQuantity,
    startedAt: t.startedAt || t.assignedAt,
    createdAt: t.assignedAt,
    taskId: t.id,
    printJobId: t.printJobId,
  }));

  res.status(200).json({ success: true, data: formattedTasks });
});

export const completeLabelTask = catchAsync(async (req: Request, res: Response) => {
  const { workOrderId, appliedQuantity } = req.body;

  const result = await prisma.$transaction(async (tx: any) => {
    const task = await tx.labelApplicationTask.findFirst({
      where: { woId: workOrderId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      include: { workOrder: true },
      orderBy: { assignedAt: 'desc' }
    });

    if (!task) throw new Error('Task not found for this work order');

    const updatedTask = await tx.labelApplicationTask.update({
      where: { id: task.id },
      data: {
        appliedQuantity: task.appliedQuantity + appliedQuantity,
        remainingQuantity: Math.max(0, task.requiredQuantity - (task.appliedQuantity + appliedQuantity)),
        status: (task.appliedQuantity + appliedQuantity >= task.requiredQuantity) ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: (task.appliedQuantity + appliedQuantity >= task.requiredQuantity) ? new Date() : null,
      }
    });

    // Also update WorkOrder labelsApplied
    const wo = await tx.workOrder.update({
      where: { id: task.woId },
      data: {
        labelsApplied: { increment: appliedQuantity },
        status: (task.appliedQuantity + appliedQuantity >= task.requiredQuantity) ? 'LABELS_APPLIED' : 'LABEL_APPLICATION_IN_PROGRESS',
      }
    });

    return updatedTask;
  });

  res.status(200).json({ success: true, data: result });
});
