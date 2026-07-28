import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getPrintHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await prisma.labelPrintJob.findMany({
    include: {
      workOrder: {
        include: {
          product: true,
        },
      },
      printedBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const formatted = history.map((job: any) => ({
    id: job.id,
    woNo: job.workOrder?.woNumber || 'Unknown',
    sku: job.workOrder?.product?.sku || 'Unknown',
    batchNo: job.batchNumber,
    printedQty: job.printedQty,
    printedBy: job.printedBy?.name || 'Unknown',
    status: job.status,
    timestamp: job.createdAt,
    reprintReason: job.reprintReason,
  }));

  res.status(200).json({ success: true, data: formatted });
});

export const printLabels = catchAsync(async (req: Request, res: Response) => {
  const { workOrderId, batchNumber, barcodeType, printedQty } = req.body;
  const userId = req.user!.id;

  const job = await prisma.labelPrintJob.create({
    data: {
      workOrderId,
      batchNumber,
      barcodeType,
      printedQty,
      printedById: userId,
      status: 'Printed',
    },
    include: {
      workOrder: {
        include: {
          product: true,
        },
      },
      printedBy: true,
    },
  });

  const formatted = {
    id: job.id,
    woNo: job.workOrder.woNumber,
    sku: job.workOrder.product.sku,
    batchNo: job.batchNumber,
    printedQty: job.printedQty,
    printedBy: job.printedBy.name,
    status: job.status,
    timestamp: job.createdAt,
    reprintReason: job.reprintReason,
  };

  res.status(201).json({ success: true, data: formatted });
});

export const reprintLabels = catchAsync(async (req: Request, res: Response) => {
  const { jobId, reprintReason } = req.body;
  const userId = req.user!.id;

  const originalJob = await prisma.labelPrintJob.findUnique({
    where: { id: jobId },
    include: { workOrder: true },
  });

  if (!originalJob) {
    return res.status(404).json({ success: false, message: 'Original print job not found' });
  }

  // If reprint qty > 100, create approval request instead of immediate reprint
  if (originalJob.printedQty > 100) {
    const approval = await prisma.approvalRequest.create({
      data: {
        type: 'BARCODE_REPRINT',
        relatedEntityId: originalJob.workOrderId,
        relatedEntityName: `Work Order #${originalJob.workOrder.woNumber} - Barcode Reprint`,
        requestedById: userId,
        reason: reprintReason || 'Reprint requires approval due to high quantity',
        priority: 'MEDIUM',
        status: 'PENDING',
        proposedValues: {
          jobId: originalJob.id,
          reprintQty: originalJob.printedQty,
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

  // If <= 100, create reprint directly
  const job = await prisma.labelPrintJob.create({
    data: {
      workOrderId: originalJob.workOrderId,
      batchNumber: originalJob.batchNumber,
      barcodeType: originalJob.barcodeType,
      printedQty: originalJob.printedQty,
      printedById: userId,
      status: 'Reprinted',
      reprintReason,
    },
    include: {
      workOrder: {
        include: {
          product: true,
        },
      },
      printedBy: true,
    },
  });

  const formatted = {
    id: job.id,
    woNo: job.workOrder.woNumber,
    sku: job.workOrder.product.sku,
    batchNo: job.batchNumber,
    printedQty: job.printedQty,
    printedBy: job.printedBy.name,
    status: job.status,
    timestamp: job.createdAt,
    reprintReason: job.reprintReason,
  };

  res.status(201).json({ success: true, data: formatted, requiresApproval: false });
});
