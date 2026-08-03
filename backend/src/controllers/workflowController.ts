import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { WorkflowService } from '../services/workflowService';

// Helper: detect DB offline / connection errors
const isDbOfflineError = (err: any) =>
  err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1008' ||
  (err?.message && (err.message.includes('ENETUNREACH') || err.message.includes('connect') || err.message.includes('tenant') || err.message.includes('database')));

// --- Quality Check ---
export const getQualityChecks = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await WorkflowService.getQualityChecks(req.query);
    sendResponse(res, 200, 'Quality Checks retrieved', result);
  } catch (err: any) {
    if (isDbOfflineError(err)) return sendResponse(res, 200, 'Quality Checks retrieved (offline mode)', []);
    throw err;
  }
});

export const getFinishedGoods = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await WorkflowService.getFinishedGoods(req.query);
    sendResponse(res, 200, 'Finished Goods retrieved', result);
  } catch (err: any) {
    if (isDbOfflineError(err)) return sendResponse(res, 200, 'Finished Goods retrieved (offline mode)', []);
    throw err;
  }
});

export const getRepackingLogs = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await WorkflowService.getRepackingLogs(req.query);
    sendResponse(res, 200, 'Repacking Logs retrieved', result);
  } catch (err: any) {
    if (isDbOfflineError(err)) return sendResponse(res, 200, 'Repacking Logs retrieved (offline mode)', []);
    throw err;
  }
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
