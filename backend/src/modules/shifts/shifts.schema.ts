import { z } from 'zod';

export const openShiftSchema = z.object({
  initialCash: z.number().min(0, "Initial cash must be non-negative")
});

export const cashMovementSchema = z.object({
  type: z.enum(['CASH_IN', 'CASH_OUT'], {
    message: "Movement type must be CASH_IN or CASH_OUT"
  }),
  amount: z.number().positive("Amount must be greater than zero"),
  reason: z.string().min(3, "Reason must be at least 3 characters long")
});

export const closeShiftSchema = z.object({
  countedCash: z.number().min(0, "Counted cash must be non-negative"),
  notes: z.string().optional()
});

export const getShiftsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cashierId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional()
});

export type OpenShiftDTO = z.infer<typeof openShiftSchema>;
export type CashMovementDTO = z.infer<typeof cashMovementSchema>;
export type CloseShiftDTO = z.infer<typeof closeShiftSchema>;
export type GetShiftsQueryDTO = z.infer<typeof getShiftsQuerySchema>;

