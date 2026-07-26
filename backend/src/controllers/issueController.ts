import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reportIssue = async (req: Request, res: Response) => {
  try {
    const { type, description, photoUrls, priority, woId, reportedById } = req.body;

    if (!type || !description || !reportedById) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const issue = await prisma.issue.create({
      data: {
        type,
        description,
        photoUrls: photoUrls || [],
        priority: priority || 'MEDIUM',
        woId: woId || null,
        reportedById,
        status: 'OPEN',
      },
    });

    res.status(201).json({ message: 'Issue reported successfully', issue });
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
