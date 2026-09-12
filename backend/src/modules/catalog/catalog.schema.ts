import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional()
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Product name is required"),
  description: z.string().min(10, "Description must be detailed"),
  sku: z.string().min(3, "SKU is required"),
  price: z.number().positive("Price must be a positive number"),
  categoryId: z.string().uuid("Invalid Category ID"),
  brandId: z.string().uuid("Invalid Brand ID").optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE")
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type CreateProductDTO = z.infer<typeof createProductSchema>;