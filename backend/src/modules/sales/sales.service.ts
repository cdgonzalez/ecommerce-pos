import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateSaleDTO } from './sales.schema';

export class SalesService {
  async processSale(cashierId: string, data: CreateSaleDTO) {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsData = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true }
        });

        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product ${item.productId} is unavailable`, 400);
        }

        if (!product.inventory || product.inventory.quantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }

        // Deducción atómica
        const updatedInventory = await tx.inventory.update({
          where: { productId: product.id },
          data: { quantity: { decrement: item.quantity } }
        });

        if (updatedInventory.quantity < 0) {
          throw new AppError(`Concurrency error: Insufficient stock for ${product.name}`, 409);
        }

        // Registrar movimiento del POS
        await tx.stockMovement.create({
          data: {
            inventoryId: product.inventory.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'POS Sale',
            userId: cashierId
          }
        });

        const unitPrice = Number(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        saleItemsData.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice,
          quantity: item.quantity,
          totalPrice
        });
      }

      const taxes = subtotal * 0.16; // IVA genérico
      const total = subtotal + taxes;

      const sale = await tx.sale.create({
        data: {
          cashierId,
          customerId: data.customerId,
          subtotal,
          taxes,
          total,
          items: {
            create: saleItemsData
          }
        },
        include: { items: true, customer: true }
      });

      return sale;
    });
  }

  async getSales(limit: number = 50) {
    return prisma.sale.findMany({
      take: limit,
      include: { 
        cashier: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}