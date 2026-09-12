import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  reason: z.string().min(3, "Reason is required for auditing").optional()
});

export type AdjustStockDTO = z.infer<typeof adjustStockSchema>;