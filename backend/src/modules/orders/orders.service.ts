import prisma from '../../core/database/prisma.client';
import redisClient from '../../core/cache/redis.client';
import logger from '../../core/utils/logger';
import { AppError } from '../../core/utils/AppError';
import { CreateOrderDTO } from './orders.schema';

export class OrdersService {
  async createOrder(userId: string, data: CreateOrderDTO) {
    // 1. Ordenar items por productId para prevenir deadlocks en transacciones concurrentes
    const sortedItems = [...data.items].sort((a, b) => a.productId.localeCompare(b.productId));

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

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
            reason: 'E-Commerce Sale',
            userId: userId
          }
        });

        const unitPrice = Number(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItemsData.push({
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

      // 1. Crear Orden con estatus PROCESSING (El pago se asume exitoso síncronamente)
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PROCESSING', 
          subtotal,
          taxes,
          total,
          shippingAddress: data.shippingAddress,
          items: {
            create: orderItemsData
          }
        },
      });

      // 2. Registrar el cobro en la entidad Payments vinculada a la Orden
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: data.paymentMethod,
          status: 'COMPLETED',
          reference: `WEB-${Date.now()}` // Mock de ID de transacción de pasarela
        }
      });

      return await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, payments: true }
      });
    });

    // 2. Invalidar caché del catálogo tras confirmar el commit de la orden
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys('catalog:products:*');
        if (keys.length > 0) await redisClient.del(keys);
      }
    } catch (cacheErr) {
      logger.warn('Failed to invalidate catalog cache after order:', cacheErr);
    }

    return result;
  }

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
