import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid("Invalid Customer ID").optional().nullable(),
  items: z.array(saleItemSchema).min(1, "Sale must contain at least one item"),
});

export type CreateSaleDTO = z.infer<typeof createSaleSchema>;