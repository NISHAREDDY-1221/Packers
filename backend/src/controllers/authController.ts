import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middlewares/error";
import { sendResponse } from "../utils/response";

const signToken = (id: string, role: string, permissions: string[]) => {
  return jwt.sign(
    { id, role, permissions },
    process.env.JWT_SECRET || "secret",
    {
      expiresIn: "1d",
    },
  );
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, roleName } = req.body;

  let role = await prisma.role.findUnique({ where: { name: roleName } });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        permissions: ["READ_DASHBOARD"],
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

  const token = signToken(
    newUser.id,
    newUser.role.name,
    newUser.role.permissions,
  );

  sendResponse(res, 201, "User registered successfully", {
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
    throw new AppError(401, "Incorrect email or password");
  }

  const token = signToken(user.id, user.role.name, user.role.permissions);

  sendResponse(res, 200, "Login successful", {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
  });
});
