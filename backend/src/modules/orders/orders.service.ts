import prisma from '../../core/database/prisma.client';
import redisClient from '../../core/cache/redis.client';
import logger from '../../core/utils/logger';
import { AppError } from '../../core/utils/AppError';
import { buildPaginationMeta } from '../../core/utils/pagination';
import { auditService } from '../audit/audit.service';
import { 
  CreateOrderDTO, 
  OrderQueryDTO, 
  UpdateOrderStatusDTO, 
  CancelOrderDTO 
} from './orders.schema';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

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

  async getOrders(params: OrderQueryDTO) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (params.status) {
      whereClause.status = params.status;
    }

    if (params.search) {
      whereClause.OR = [
        { id: { contains: params.search, mode: 'insensitive' } },
        { user: { name: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } }
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          payments: { select: { id: true, method: true, amount: true, status: true, reference: true } },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      orders,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payments: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusDTO, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(data.status)) {
      throw new AppError(`Cannot transition order from ${order.status} to ${data.status}`, 400);
    }

    if (data.status === 'SHIPPED' && (!data.carrier || !data.trackingNumber)) {
      throw new AppError('Carrier and tracking number are mandatory when updating status to SHIPPED', 400);
    }

    const updatePayload: any = { status: data.status };
    if (data.carrier) updatePayload.carrier = data.carrier;
    if (data.trackingNumber) updatePayload.trackingNumber = data.trackingNumber;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updatePayload,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        payments: true
      }
    });

    await auditService.logAction({
      userId: adminId,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'ORDER',
      entityId: orderId,
      metadata: {
        previousStatus: order.status,
        newStatus: data.status,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber
      }
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, data: CancelOrderDTO, adminId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'CANCELLED') {
        throw new AppError('Order is already cancelled', 400);
      }

      if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
        throw new AppError(`Cannot cancel order that has already been ${order.status.toLowerCase()}`, 400);
      }

      // 1. Ordenar items por productId para prevenir deadlocks
      const sortedItems = [...order.items].sort((a, b) => a.productId.localeCompare(b.productId));

      // 2. Restituir inventario de forma atómica y crear StockMovements
      for (const item of sortedItems) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId }
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              inventoryId: inventory.id,
              type: 'IN',
              quantity: item.quantity,
              reason: `Order Cancellation: ${data.cancellationReason}`,
              userId: adminId
            }
          });
        }
      }

      // 3. Actualizar estado de la orden
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: data.cancellationReason
        }
      });

      // 4. Marcar pagos como REFUNDED
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: 'REFUNDED' }
      });

      // 5. Registrar auditoría
      await auditService.logAction({
        userId: adminId,
        action: 'ORDER_CANCELLED',
        entity: 'ORDER',
        entityId: order.id,
        metadata: {
          previousStatus: order.status,
          cancellationReason: data.cancellationReason,
          itemsRestoredCount: order.items.length
        }
      });

      return updatedOrder;
    });

    // 6. Invalidar caché del catálogo post-commit
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys('catalog:products:*');
        if (keys.length > 0) await redisClient.del(keys);
      }
    } catch (cacheErr) {
      logger.warn('Failed to invalidate catalog cache after order cancellation:', cacheErr);
    }

    return {
      message: 'Order cancelled and stock restored successfully',
      order: result
    };
  }
}
