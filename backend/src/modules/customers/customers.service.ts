import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateCustomerDTO } from './customers.schema';

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
}