import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get settings and profile for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true }
    });

    let setting = await prisma.userSetting.findUnique({
      where: { userId },
    });
    if (!setting) {
      setting = await prisma.userSetting.create({
        data: { userId, theme: "light", payload: {} },
      });
    }
    res.status(200).json({ success: true, data: { ...setting, user } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update settings and profile
router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { theme, payload, name, email } = req.body;

    if (name || email) {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    const setting = await prisma.userSetting.upsert({
      where: { userId },
      update: { theme, payload: payload || {} },
      create: { userId, theme: theme || "light", payload: payload || {} },
    });
    res.status(200).json({ success: true, data: setting });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
