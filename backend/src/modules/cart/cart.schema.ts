import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
});

export type ValidateCartDTO = z.infer<typeof validateCartSchema>;