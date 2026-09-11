import bcrypt from 'bcrypt';
import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateUserDTO } from './users.schema';

export class UsersService {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        roles: {
          include: {
            role: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createUser(data: CreateUserDTO) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 409);

    const roleExists = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!roleExists) throw new AppError('Role not found', 404);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        roles: {
          create: [{ roleId: data.roleId }]
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
  }
}