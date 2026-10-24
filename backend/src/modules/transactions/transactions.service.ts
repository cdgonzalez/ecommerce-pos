import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { buildPaginationMeta } from '../../core/utils/pagination';
import { ProcessRefundDTO } from './transactions.schema';

export class TransactionsService {
  async getUnifiedHistory(params: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;
    const fetchCount = skip + limit;

    // 1. Ejecutar consultas en paralelo para conteo y obtención de órdenes y ventas
    const [totalOrders, totalSales, orders, sales] = await Promise.all([
      prisma.order.count(),
      prisma.sale.count(),
      prisma.order.findMany({
        take: fetchCount,
        include: { user: { select: { name: true } }, payments: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.findMany({
        take: fetchCount,
        include: { customer: { select: { firstName: true, lastName: true } }, payments: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 2. Mapear a un formato DTO Unificado
    const unifiedTransactions = [
      ...orders.map(o => ({
        id: o.id,
        type: 'ORDER' as const,
        clientName: o.user.name,
        total: o.total,
        status: o.status,
        date: o.createdAt,
        paymentMethod: o.payments[0]?.method || 'UNKNOWN'
      })),
      ...sales.map(s => ({
        id: s.id,
        type: 'SALE' as const,
        clientName: s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : 'Walk-in Customer',
        total: s.total,
        status: s.status,
        date: s.createdAt,
        paymentMethod: s.payments[0]?.method || 'UNKNOWN'
      }))
    ];

    // 3. Ordenar cronológicamente y aplicar paginación exacta (skip y limit)
    const sorted = unifiedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    const paginatedItems = sorted.slice(skip, skip + limit);
    const total = totalOrders + totalSales;

    return {
      transactions: paginatedItems,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  async processRefund(adminId: string, data: ProcessRefundDTO) {
    return prisma.$transaction(async (tx) => {
      let itemsToRefund: { productId: string, quantity: number, productName: string }[] = [];

      // A. Lógica para Órdenes Web
      if (data.type === 'ORDER') {
        const order = await tx.order.findUnique({
          where: { id: data.transactionId },
          include: { items: true }
        });

        if (!order) throw new AppError('Order not found', 404);
        if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
          throw new AppError('Transaction is already refunded or cancelled', 400);
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'REFUNDED' }
        });
        
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: 'REFUNDED' }
        });

        itemsToRefund = order.items;
      } 
      // B. Lógica para Ventas Físicas (POS)
      else {
        const sale = await tx.sale.findUnique({
          where: { id: data.transactionId },
          include: { items: true }
        });

        if (!sale) throw new AppError('Sale not found', 404);
        if (sale.status === 'REFUNDED') {
          throw new AppError('Transaction is already refunded', 400);
        }

        await tx.sale.update({
          where: { id: sale.id },
          data: { status: 'REFUNDED' }
        });

        await tx.payment.updateMany({
          where: { saleId: sale.id },
          data: { status: 'REFUNDED' }
        });

        itemsToRefund = sale.items;
      }

      // C. Restituir inventario de forma atómica y crear registros de auditoría
      for (const item of itemsToRefund) {
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
              type: 'IN', // Movimiento de entrada por devolución
              quantity: item.quantity,
              reason: data.reason || `Refund for ${data.type} ${data.transactionId.split('-')[0]}`,
              userId: adminId
            }
          });
        }
      }

      return {
        message: 'Refund processed successfully',
        transactionId: data.transactionId,
        itemsRestored: itemsToRefund.length
      };
    });
  }
}
