import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { CreateOrderDTO } from './orders.schema';

export class OrdersService {
  async createOrder(userId: string, data: CreateOrderDTO) {
    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        // 1. Obtener el producto y su inventario actual
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true }
        });

        if (!product || product.status !== 'ACTIVE') {
          throw new AppError(`Product ${item.productId} is unavailable`, 400);
        }

        // 2. Verificar y descontar inventario atómicamente
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

        // Registrar movimiento de stock por la venta
        await tx.stockMovement.create({
          data: {
            inventoryId: product.inventory.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'E-Commerce Sale',
            userId: userId
          }
        });

        // 3. Preparar el snapshot del OrderItem
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

      // 4. Calcular totales
      const taxes = subtotal * 0.16; // 16% IVA
      const total = subtotal + taxes;

      // 5. Crear la orden y sus ítems
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          subtotal,
          taxes,
          total,
          shippingAddress: data.shippingAddress,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      return order;
    });
  }

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}