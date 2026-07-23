import { z } from "zod";

export const createWorkOrderSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    recipeId: z.string().uuid(),
    requiredQty: z.number().positive(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    expectedDate: z.string().datetime().optional(),
  }),
});

export const updateWorkOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "CANCELLED"]),
  }),
});

export const issueMaterialsSchema = z.object({
  body: z.object({
    payload: z.any(), // In a real scenario, this would be strictly typed array of {productId, issuedQty}
  }),
});

export const completePackingSchema = z.object({
  body: z.object({
    actualProduced: z.number().nonnegative(),
    actualRejected: z.number().nonnegative(),
  }),
});
