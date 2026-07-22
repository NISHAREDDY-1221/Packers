import { z } from 'zod';

export const submitQCSchema = z.object({
  body: z.object({
    woId: z.string(),
    checkedQty: z.number().positive(),
    result: z.enum(['PASS', 'PARTIAL_PASS', 'REJECT', 'REWORK', 'DISCARD']),
    severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
    failureReason: z.string().optional(),
    remarks: z.string().optional(),
    checksPayload: z.any(),
  }),
});

export const postFinishedGoodsSchema = z.object({
  body: z.object({
    woId: z.string().uuid(),
    batchNumber: z.string().min(1, 'Batch number is required'),
    postedQty: z.number().positive(),
    destination: z.string().min(1, 'Destination is required'),
  }),
});

export const logRepackingSchema = z.object({
  body: z.object({
    sourceWoId: z.string().uuid(),
    repackType: z.string().min(1, 'Repack type is required'),
    recoverableQty: z.number().min(0),
    wasteQty: z.number().min(0),
    targetRecipeId: z.string().uuid().optional(),
  }),
});
