import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { ApprovalService } from '../services/approvalService';

export const getApprovals = catchAsync(async (req: Request, res: Response) => {
  const result = await ApprovalService.getApprovals(req.query);
  sendResponse(res, 200, 'Approvals retrieved', result);
});

export const processApproval = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { action, comments } = req.body;
  const userId = req.user!.id;

  const result = await ApprovalService.processApproval(id, action, userId, comments);
  sendResponse(res, 200, `Approval ${action.toLowerCase()}ed successfully`, result);
});
