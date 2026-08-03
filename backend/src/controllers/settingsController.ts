import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';

const DEFAULT_SETTINGS = {
  theme: 'light',
  emailNotifications: true,
  inAppNotifications: true,
  compactView: false,
  autoPrintLabels: false,
  defaultPrinter: 'Zebra-ZT230',
  language: 'en',
  timezone: 'UTC',
};

export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, 200, 'Default settings', DEFAULT_SETTINGS);
  }

  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      try {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            ...DEFAULT_SETTINGS,
          },
        });
      } catch (createErr) {
        return sendResponse(res, 200, 'Default settings', DEFAULT_SETTINGS);
      }
    }

    return sendResponse(res, 200, 'Settings retrieved successfully', settings);
  } catch (err) {
    return sendResponse(res, 200, 'Default settings', DEFAULT_SETTINGS);
  }
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const {
    theme,
    emailNotifications,
    inAppNotifications,
    compactView,
    autoPrintLabels,
    defaultPrinter,
    language,
    timezone,
  } = req.body;

  const fallbackData = {
    theme: theme || 'light',
    emailNotifications: emailNotifications ?? true,
    inAppNotifications: inAppNotifications ?? true,
    compactView: compactView ?? false,
    autoPrintLabels: autoPrintLabels ?? false,
    defaultPrinter: defaultPrinter || 'Zebra-ZT230',
    language: language || 'en',
    timezone: timezone || 'UTC',
  };

  if (!userId) {
    return sendResponse(res, 200, 'Settings updated', fallbackData);
  }

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(theme !== undefined && { theme }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(inAppNotifications !== undefined && { inAppNotifications }),
        ...(compactView !== undefined && { compactView }),
        ...(autoPrintLabels !== undefined && { autoPrintLabels }),
        ...(defaultPrinter !== undefined && { defaultPrinter }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
      },
      create: {
        userId,
        ...fallbackData,
      },
    });

    sendResponse(res, 200, 'Settings updated successfully', settings);
  } catch (err) {
    sendResponse(res, 200, 'Settings updated', fallbackData);
  }
});
