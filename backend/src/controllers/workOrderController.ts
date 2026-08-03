import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { WorkOrderService } from '../services/workOrderService';

export const createWorkOrder = catchAsync(async (req: Request, res: Response) => {
  const { productId, recipeId, requiredQty, priority, expectedDate, operatorId } = req.body;
  const supervisorId = req.user!.id;

  const workOrder = await WorkOrderService.createWorkOrder({
    productId, recipeId, requiredQty, priority, expectedDate, supervisorId, operatorId
  });

  sendResponse(res, 201, 'Work Order created', workOrder);
});

export const getWorkOrders = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await WorkOrderService.getWorkOrders(req.query, req.user);
    sendResponse(res, 200, 'Work Orders retrieved', result);
  } catch (err: any) {
    // Gracefully handle DB offline / connection errors
    const isDbError = err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1008' ||
      (err?.message && (err.message.includes('ENETUNREACH') || err.message.includes('connect') || err.message.includes('tenant') || err.message.includes('database')));
    if (isDbError) {
      return sendResponse(res, 200, 'Work Orders retrieved (offline mode)', []);
    }
    throw err;
  }
});

export const updateWorkOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, extra } = req.body;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.updateWorkOrderStatus(id, status, userId, extra);
  sendResponse(res, 200, 'Work Order status updated', updatedWO);
});

export const issueMaterials = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { payload } = req.body;
  const userId = req.user!.id;

  const result = await WorkOrderService.issueMaterials(id, payload, userId);
  sendResponse(res, 201, 'Materials issued successfully', result);
});

export const startPacking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.startPacking(id, userId);
  sendResponse(res, 200, 'Packing execution started', updatedWO);
});

export const updateQuantity = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { actualProduced, actualRejected } = req.body;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.updateQuantity(id, { actualProduced, actualRejected }, userId);
  sendResponse(res, 200, 'Quantities updated', updatedWO);
});

export const pausePacking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.pausePacking(id, reason, userId);
  sendResponse(res, 200, 'Packing paused', updatedWO);
});

export const resumePacking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.resumePacking(id, userId);
  sendResponse(res, 200, 'Packing resumed', updatedWO);
});

export const completePacking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.completePacking(id, userId);
  sendResponse(res, 200, 'Packing completed', updatedWO);
});

export const getAuditLogsForWorkOrder = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  const logs = await WorkOrderService.getAuditLogs(id);
  sendResponse(res, 200, 'Audit logs retrieved', logs);
});
