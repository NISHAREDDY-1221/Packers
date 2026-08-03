import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { AppError } from '../middlewares/error';

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(401, 'User not authenticated');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        settings: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    sendResponse(res, 200, 'Profile retrieved', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt,
      settings: user.settings,
    });
  } catch (err: any) {
    const isDbError = err?.code === 'P1001' || err?.code === 'P1002' || err?.code === 'P1008' ||
      (err?.message && (err.message.includes('ENETUNREACH') || err.message.includes('connect') || err.message.includes('tenant') || err.message.includes('database')));
    if (isDbError && req.user) {
      // Fallback: return JWT user data (name/email not in token, so use placeholders)
      return sendResponse(res, 200, 'Profile retrieved (offline mode)', {
        id: req.user.id,
        name: 'User',
        email: '',
        role: req.user.role,
        permissions: req.user.permissions || [],
        isActive: true,
        createdAt: new Date().toISOString(),
        settings: null,
      });
    }
    throw err;
  }
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { name, email } = req.body;

  if (!userId) {
    throw new AppError(401, 'User not authenticated');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
    include: { role: true },
  });

  sendResponse(res, 200, 'Profile updated successfully', {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role.name,
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new AppError(401, 'User not authenticated');
  }

  if (!currentPassword || !newPassword) {
    throw new AppError(400, 'Current password and new password are required');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new AppError(401, 'Incorrect current password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  sendResponse(res, 200, 'Password changed successfully', null);
});
