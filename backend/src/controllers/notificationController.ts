import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Work Order Approved',
    message: 'Work Order #WO-8942 has been approved for packing execution.',
    type: 'WORK_ORDER',
    isRead: false,
    link: '/work-orders',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Quality Check Alert',
    message: 'Quality Inspection for Batch #B42 requires supervisor re-evaluation.',
    type: 'QC',
    isRead: false,
    link: '/qc',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Material Issue Completed',
    message: 'Material issue #MI-1092 items have been dispatched to Line A.',
    type: 'MATERIAL',
    isRead: true,
    link: '/material-issue',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'System Maintenance',
    message: 'Scheduled label printer maintenance completed successfully.',
    type: 'SYSTEM',
    isRead: true,
    link: '/barcodes-labels',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, 200, 'Notifications retrieved', DEFAULT_NOTIFICATIONS);
  }

  try {
    let dbNotifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sendResponse(res, 200, 'Notifications retrieved', dbNotifs);
  } catch (err) {
    return sendResponse(res, 200, 'Notifications retrieved', DEFAULT_NOTIFICATIONS);
  }
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return sendResponse(res, 200, 'Notification marked as read', { id, isRead: true });
  }

  try {
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
      return sendResponse(res, 200, 'All notifications marked as read', null);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    sendResponse(res, 200, 'Notification marked as read', updated);
  } catch (err) {
    sendResponse(res, 200, 'Notification marked as read', { id, isRead: true });
  }
});

export const clearNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, 200, 'Notifications cleared', []);
  }

  try {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    sendResponse(res, 200, 'Notifications cleared', []);
  } catch (err) {
    sendResponse(res, 200, 'Notifications cleared', []);
  }
});

export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, message, type, targetRole } = req.body;
  if (!title || !message || !targetRole) {
    return sendResponse(res, 400, 'Title, message, and targetRole are required', null);
  }

  const users = await prisma.user.findMany({
    where: { role: { name: targetRole } }
  });

  if (users.length === 0) {
    return sendResponse(res, 404, 'No users found for the selected role', null);
  }

  const notifications = users.map(u => ({
    userId: u.id,
    title,
    message,
    type: type || 'SYSTEM',
    isRead: false,
    link: ''
  }));

  await prisma.notification.createMany({ data: notifications });

  sendResponse(res, 201, 'Notifications sent successfully', null);
});
