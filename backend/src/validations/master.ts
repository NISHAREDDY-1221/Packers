import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  }),
});

export const createUOMSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    abbreviation: z.string().min(1, "Abbreviation is required"),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, "SKU is required"),
    name: z.string().min(1, "Name is required"),
    categoryId: z.string().uuid(),
    uomId: z.string().uuid(),
    type: z.enum(["RAW_MATERIAL", "PACKAGING", "FINISHED_GOOD"]),
  }),
});

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
  }),
});

export const createRecipeSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Recipe code is required"),
    name: z.string().min(1, "Recipe name is required"),
    outputProductId: z.string().uuid(),
    outputQty: z.number().positive(),
    items: z
      .array(
        z.object({
          inputProductId: z.string().uuid(),
          requiredQty: z.number().positive(),
          tolerancePct: z.number().min(0).max(100).default(0),
          isPackaging: z.boolean().default(false),
        }),
      )
      .min(1, "At least one input material is required"),
  }),
});
