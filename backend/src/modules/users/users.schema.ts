import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleId: z.string().uuid("Invalid role ID")
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;