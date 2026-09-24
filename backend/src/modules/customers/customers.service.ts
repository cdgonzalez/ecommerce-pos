import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateCustomerDTO, UpdateMyProfileDTO } from './customers.schema';

export class CustomersService {
  async createCustomer(data: CreateCustomerDTO) {
    // Si provee email, verificar unicidad
    if (data.email) {
      const existing = await prisma.customer.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError('Customer with this email already exists', 409);
    }

    return prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        userId: data.userId,
        addresses: data.addresses ? {
          create: data.addresses
        } : undefined
      },
      include: { addresses: true }
    });
  }

  async getCustomers(search?: string) {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.customer.findMany({
      where: whereClause,
      include: { addresses: { where: { isDefault: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { addresses: true, user: { select: { id: true, isActive: true } } }
    });

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  // NUEVO: Métodos B2C (Perfil de Usuario Logueado)
  async getMyProfile(userId: string) {
    let customer = await prisma.customer.findUnique({
      where: { userId },
      include: { addresses: true }
    });

    // Lazy initialization: Si el usuario web nunca configuró perfil comercial, crearlo vacío
    if (!customer) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found', 404);
      
      const [firstName, ...lastNameParts] = user.name.split(' ');
      customer = await prisma.customer.create({
        data: {
          firstName: firstName || 'User',
          lastName: lastNameParts.join(' ') || 'Web',
          email: user.email,
          userId: user.id
        },
        include: { addresses: true }
      });
    }

    return customer;
  }

  async updateMyProfile(userId: string, data: UpdateMyProfileDTO) {
    const customer = await this.getMyProfile(userId); // Asegura que exista

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar datos base
      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        }
      });

      // 2. Si se provee dirección, actualizar o crear la principal
      if (data.address) {
        // Desmarcar direcciones previas como default
        await tx.address.updateMany({
          where: { customerId: customer.id },
          data: { isDefault: false }
        });

        await tx.address.create({
          data: {
            ...data.address,
            isDefault: true,
            customerId: customer.id
          }
        });
      }

      return tx.customer.findUnique({
        where: { id: customer.id },
        include: { addresses: true }
      });
    });
  }
}