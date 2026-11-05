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

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
  carrier: z.string().min(2, "Carrier name is required when shipping").optional(),
  trackingNumber: z.string().min(4, "Tracking code is required when shipping").optional(),
}).refine(data => {
  if (data.status === 'SHIPPED') {
    return Boolean(data.carrier && data.trackingNumber);
  }
  return true;
}, {
  message: "Carrier and tracking number are mandatory when updating status to SHIPPED",
  path: ["trackingNumber"]
});

export const cancelOrderSchema = z.object({
  cancellationReason: z.string().min(5, "Cancellation reason must be at least 5 characters long"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type OrderQueryDTO = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderDTO = z.infer<typeof cancelOrderSchema>;
