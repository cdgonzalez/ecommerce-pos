import bcrypt from 'bcrypt';
import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateUserDTO } from './users.schema';
import { auditService } from '../audit/audit.service'; // <--- AGREGADO

export class UsersService {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true, email: true, name: true, isActive: true, createdAt: true,
        roles: { include: { role: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllRoles() {
    return prisma.role.findMany({
      select: { id: true, name: true, description: true }
    });
  }

  async createUser(data: CreateUserDTO, adminId?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 409);

    const roleExists = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!roleExists) throw new AppError('Role not found', 404);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        roles: {
          create: [{ roleId: data.roleId }]
        }
      },
      select: { id: true, email: true, name: true }
    });

    // Inyección de la Auditoría Transversal
    await auditService.logAction({
      userId: adminId,
      action: 'CREATE',
      entity: 'USER',
      entityId: newUser.id,
      metadata: { email: newUser.email, assignedRole: roleExists.name }
    });

    return newUser;
  }
}