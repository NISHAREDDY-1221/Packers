import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { WorkflowService } from '../services/workflowService';

// --- Quality Check ---
export const getQualityChecks = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkflowService.getQualityChecks(req.query);
  sendResponse(res, 200, 'Quality Checks retrieved', result);
});

export const getFinishedGoods = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkflowService.getFinishedGoods(req.query);
  sendResponse(res, 200, 'Finished Goods retrieved', result);
});

export const getRepackingLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkflowService.getRepackingLogs(req.query);
  sendResponse(res, 200, 'Repacking Logs retrieved', result);
});

// --- QC Checklists ---
export const getQcChecklists = catchAsync(async (req: Request, res: Response) => {
  // Configurable QC Checkpoints
  const checklists = [
    { id: '1', label: 'Packaging Quality', required: true },
    { id: '2', label: 'Label Verification', required: true },
    { id: '3', label: 'Barcode Verification', required: true },
    { id: '4', label: 'Quantity Verification', required: true },
    { id: '5', label: 'Product Condition', required: true },
    { id: '6', label: 'Expiry Date Verification', required: true },
  ];
  sendResponse(res, 200, 'QC Checklists retrieved', checklists);
});

export const submitQualityCheck = catchAsync(async (req: Request, res: Response) => {
  const { woId, checkedQty, result, severity, failureReason, remarks, checksPayload } = req.body;
  const inspectorId = req.user!.id;

  const transaction = await WorkflowService.submitQualityCheck({
    woId, checkedQty, result, severity, failureReason, remarks, checksPayload, inspectorId
  });

  sendResponse(res, 201, 'Quality Check submitted successfully', transaction);
});

// --- Finished Goods ---
export const postFinishedGoods = catchAsync(async (req: Request, res: Response) => {
  const { woId, batchNumber, postedQty, destination } = req.body;
  const userId = req.user!.id;

  const transaction = await WorkflowService.postFinishedGoods({
    woId, batchNumber, postedQty, destination, userId
  });

  sendResponse(res, 201, 'Batch posted to Finished Goods', transaction);
});

// --- Repacking ---
export const logRepacking = catchAsync(async (req: Request, res: Response) => {
  const { sourceWoId, repackType, recoverableQty, wasteQty, targetRecipeId } = req.body;
  const userId = req.user!.id;

  const transaction = await WorkflowService.logRepacking({
    sourceWoId, repackType, recoverableQty, wasteQty, targetRecipeId, userId
  });

  sendResponse(res, 201, 'Repacking logged and new Work Order generated', transaction);
});
