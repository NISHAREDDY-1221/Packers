import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../middlewares/error';
import { sendResponse } from '../utils/response';

const signToken = (id: string, role: string, permissions: string[]) => {
  return jwt.sign({ id, role, permissions }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1d',
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, roleName } = req.body;

  let role = await prisma.role.findUnique({ where: { name: roleName } });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        permissions: ['READ_DASHBOARD'],
      },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      roleId: role.id,
    },
    include: { role: true },
  });

  const token = signToken(newUser.id, newUser.role.name, newUser.role.permissions);

  sendResponse(res, 201, 'User registered successfully', {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.name,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  const permissions = user.role?.permissions || [];
  const token = signToken(user.id, user.role.name, permissions);

  sendResponse(res, 200, 'Login successful', {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
    },
  });
});

export const getOperators = catchAsync(async (req: Request, res: Response) => {
  const operators = await prisma.user.findMany({
    where: { role: { name: 'OPERATOR' } },
    select: { id: true, name: true, email: true }
  });
  sendResponse(res, 200, 'Operators retrieved', operators);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  sendResponse(res, 200, 'Users retrieved', users);
});

export const getQCInspectors = catchAsync(async (req: Request, res: Response) => {
  const inspectors = await prisma.user.findMany({
    where: { role: { name: { in: ['QC', 'QC_INSPECTOR', 'QC_CHECKER'] } } },
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  sendResponse(res, 200, 'QC Inspectors retrieved', inspectors);
});
