import prisma from '../../core/database/prisma.client';
import { TransactionsService } from '../transactions/transactions.service';

export class DashboardService {
  private transactionsService: TransactionsService;

  constructor() {
    this.transactionsService = new TransactionsService();
  }

  async getDashboardMetrics() {
    // 1. Ejecutar agregaciones en paralelo para máximo rendimiento
    const [
      ordersAgg,
      salesAgg,
      totalCustomers,
      lowStockItems,
      recentActivity
    ] = await Promise.all([
      // Ingresos E-Commerce (ignorando reembolsados y cancelados)
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: { notIn: ['REFUNDED', 'CANCELLED'] } }
      }),
      // Ingresos POS (ignorando reembolsados)
      prisma.sale.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: { not: 'REFUNDED' } }
      }),
      // Total de clientes registrados (POS + Web)
      prisma.customer.count(),
      // Alertas de inventario utilizando raw query para comparar columnas dinámicamente
      prisma.$queryRaw<{count: bigint}[]>`SELECT COUNT(*) FROM "inventories" WHERE "quantity" <= "minStock"`,
      // Últimas 5 transacciones globales
      this.transactionsService.getUnifiedHistory({ limit: 5 })
    ]);

    const orderRevenue = Number(ordersAgg._sum.total || 0);
    const saleRevenue = Number(salesAgg._sum.total || 0);
    const totalRevenue = orderRevenue + saleRevenue;
    const totalTransactions = ordersAgg._count.id + salesAgg._count.id;
    
    // Prisma $queryRaw devuelve un array de objetos con BigInt
    const lowStockCount = lowStockItems.length > 0 ? Number(lowStockItems[0].count) : 0;

    return {
      kpis: {
        totalRevenue,
        orderRevenue,
        saleRevenue,
        totalTransactions,
        totalCustomers,
        lowStockCount
      },
      recentActivity
    };
  }
}
