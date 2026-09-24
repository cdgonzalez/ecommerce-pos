import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(10, "A complete shipping address is required"),
  paymentMethod: z.enum(["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL"], "Payment method is required"),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;