import { z } from 'zod';

export const processRefundSchema = z.object({
  transactionId: z.string().uuid("Invalid Transaction ID"),
  type: z.enum(['ORDER', 'SALE'], "Transaction type must be ORDER or SALE"),
  reason: z.string().min(5, "Refund reason is required for auditing").optional()
});

export type ProcessRefundDTO = z.infer<typeof processRefundSchema>;