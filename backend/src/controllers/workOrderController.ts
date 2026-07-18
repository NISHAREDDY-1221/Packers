import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { WorkOrderService } from '../services/workOrderService';

export const createWorkOrder = catchAsync(async (req: Request, res: Response) => {
  const { productId, recipeId, requiredQty, priority, expectedDate } = req.body;
  const supervisorId = req.user!.id;

  const workOrder = await WorkOrderService.createWorkOrder({
    productId, recipeId, requiredQty, priority, expectedDate, supervisorId
  });

  sendResponse(res, 201, 'Work Order created', workOrder);
});

export const getWorkOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkOrderService.getWorkOrders(req.query);
  sendResponse(res, 200, 'Work Orders retrieved', result);
});

export const updateWorkOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const userId = req.user!.id;

  const updatedWO = await WorkOrderService.updateWorkOrderStatus(id, status, userId);
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
