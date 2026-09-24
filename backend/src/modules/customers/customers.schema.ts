import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(3),
  country: z.string().min(2),
  isDefault: z.boolean().default(false)
});

export const createCustomerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().min(8, "Phone is too short").optional().or(z.literal('')),
  userId: z.string().uuid().optional(),
  addresses: z.array(addressSchema).optional()
});

// NUEVO: Esquema para actualización del propio perfil del cliente web
export const updateMyProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  address: addressSchema.optional()
});

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateMyProfileDTO = z.infer<typeof updateMyProfileSchema>;