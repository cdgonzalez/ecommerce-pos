import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateOrderDTO } from './orders.schema';

export class OrdersService {
  async createOrder(userId: string, data: CreateOrderDTO) {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

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

        const updatedInventory = await tx.inventory.update({
          where: { productId: product.id },
          data: { quantity: { decrement: item.quantity } }
        });

        if (updatedInventory.quantity < 0) {
          throw new AppError(`Concurrency error: Insufficient stock for ${product.name}`, 409);
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
  }

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}