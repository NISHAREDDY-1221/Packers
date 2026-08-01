import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    recipeId: z.string().uuid(),
    requiredQty: z.number().positive(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    expectedDate: z.string().datetime().optional(),
    operatorName: z.string().optional(),
  }),
});

export const updateWorkOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'DRAFT', 'PENDING', 'APPROVED', 'MATERIAL_ISSUED',
      'PACKING_STARTED', 'PACKING_IN_PROGRESS', 'PACKING_COMPLETED',
      'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED',
      'QC_PENDING', 'QC_PASSED', 'COMPLETED', 'CANCELLED'
    ]),
    extra: z.any().optional(),
  }),
});

export const issueMaterialsSchema = z.object({
  body: z.object({
    payload: z.any(), // In a real scenario, this would be strictly typed array of {productId, issuedQty}
  }),
});

export const updateQuantitySchema = z.object({
  body: z.object({
    actualProduced: z.number().min(0),
    actualRejected: z.number().min(0),
  }),
});

export const pausePackingSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
  }),
});
