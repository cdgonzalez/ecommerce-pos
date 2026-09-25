import { z } from 'zod';

export const dateRangeSchema = z.object({
  query: z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date format",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date format",
    }),
  }),
});

export type DateRangeQuery = z.infer<typeof dateRangeSchema>['query'];