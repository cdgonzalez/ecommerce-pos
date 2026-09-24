import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid("Invalid Customer ID").optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DIGITAL'], "Payment method is required"),
  items: z.array(saleItemSchema).min(1, "Sale must contain at least one item"),
});

export type CreateSaleDTO = z.infer<typeof createSaleSchema>;