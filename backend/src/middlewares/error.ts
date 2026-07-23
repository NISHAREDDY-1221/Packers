import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { sendResponse } from "../utils/response";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal Server Error";

    // Prisma connection errors
    if (
      (error as any).code === "P1001" ||
      (error as any).message?.includes("Can't reach database server")
    ) {
      statusCode = 503;
      message =
        "Database server is currently unavailable. Please try again later.";
    } else if ((error as any).code === "P1002") {
      statusCode = 503;
      message = "Database server connection timed out. Please try again later.";
    } else if ((error as any).code === "P1003") {
      statusCode = 500;
      message = "Database does not exist on the server.";
    }
    // Prisma specific errors
    else if ((error as any).code === "P2002") {
      statusCode = 409;
      message = "Resource already exists (duplicate unique field).";
    }

    error = new AppError(statusCode, message, false);
  }

  logger.error(
    `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  sendResponse(res, error.statusCode, error.message);
};
