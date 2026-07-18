import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { ReportService } from '../services/reportService';
import { AppError } from '../middlewares/error';

export const getProductionYield = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    throw new AppError(400, 'Please provide both startDate and endDate query parameters');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  const report = await ReportService.getProductionYield(start, end);
  sendResponse(res, 200, 'Production Yield Report generated', report);
});

export const getQcSummary = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    throw new AppError(400, 'Please provide both startDate and endDate query parameters');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  const report = await ReportService.getQcSummary(start, end);
  sendResponse(res, 200, 'QC Summary Report generated', report);
});
