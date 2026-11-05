import prisma from '../../core/database/prisma.client';
import redisClient from '../../core/cache/redis.client';
import logger from '../../core/utils/logger';
import { AppError } from '../../core/utils/AppError';
import { CreateSaleDTO } from './sales.schema';

export class SalesService {
  async processSale(cashierId: string, data: CreateSaleDTO) {
    // 1. Ordenar items por productId para prevenir deadlocks en transacciones concurrentes
    const sortedItems = [...data.items].sort((a, b) => a.productId.localeCompare(b.productId));

    const result = await prisma.$transaction(async (tx) => {
      // 0. Validar turno activo de caja para el cajero
      const activeShift = await tx.shift.findFirst({
        where: { cashierId, status: 'OPEN' }
      });

      if (!activeShift) {
        throw new AppError('No active open shift found for cashier. Open a shift before processing sales.', 400);
      }

      let subtotal = 0;
      const saleItemsData = [];

      for (const item of sortedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true }
        });

        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product ${item.productId} is unavailable`, 400);
        }

        if (!product.inventory) {
          throw new AppError(`No inventory record found for ${product.name}`, 400);
        }

        // Decremento condicional atómico en base de datos:
        // Solo actualiza si la cantidad disponible es mayor o igual a la solicitada
        const updateResult = await tx.inventory.updateMany({
          where: {
            productId: product.id,
            quantity: { gte: item.quantity }
          },
          data: {
            quantity: { decrement: item.quantity }
          }
        });

        if (updateResult.count === 0) {
          throw new AppError(`Insufficient stock for ${product.name}. Requested: ${item.quantity}`, 400);
        }

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

      const taxes = subtotal * 0.16;
      const total = subtotal + taxes;

      const sale = await tx.sale.create({
        data: {
          cashierId,
          shiftId: activeShift.id,
          customerId: data.customerId,
          subtotal,
          taxes,
          total,
          items: {
            create: saleItemsData
          }
        }
      });

      // Crear el registro del pago vinculado al Ticket de Venta
      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: total,
          method: data.paymentMethod,
          status: 'COMPLETED',
          reference: data.paymentMethod === 'CASH' ? null : `POS-${Date.now()}`
        }
      });

      return await tx.sale.findUnique({
        where: { id: sale.id },
        include: { items: true, customer: true, payments: true }
      });
    });

    // 2. Invalidar caché del catálogo tras confirmar el commit de la venta
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys('catalog:products:*');
        if (keys.length > 0) await redisClient.del(keys);
      }
    } catch (cacheErr) {
      logger.warn('Failed to invalidate catalog cache after sale:', cacheErr);
    }

    return result;
  }

  async getSales(limit: number = 50) {
    return prisma.sale.findMany({
      take: limit,
      include: { 
        cashier: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } },
        payments: { select: { method: true, amount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
