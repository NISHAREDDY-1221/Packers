import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error';
import { catchAsync } from '../utils/catchAsync';

interface JwtPayload {
  id: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, 'You are not logged in! Please log in to get access.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    
    // Ensure user still exists in the database
    const userExists = await require('../utils/prisma').prisma.user.findUnique({ 
      where: { id: decoded.id } 
    }).catch(() => null);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verify Error:', err, 'Token:', token);
    return next(new AppError(401, 'Invalid or expired token.'));
  }
});

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token in optionalAuth
    }
  }

  next();
};


export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return next(new AppError(403, `Forbidden: You do not have the required permission (${requiredPermission})`));
    }

    next();
  };
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, `Forbidden: Your role (${req.user.role}) is not authorized for this action.`));
    }

    next();
  };
};
