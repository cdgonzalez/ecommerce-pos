import prisma from '../../core/database/prisma.client';
import { DateRangeQuery } from './reports.schema';

export class ReportsService {
  async getDailySales(query: DateRangeQuery) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    
    // Forzamos el final del día para abarcar transacciones hasta las 23:59:59
    end.setHours(23, 59, 59, 999);

    // Utilizamos queryRaw para el JOIN analítico eficiente en PostgreSQL
    const dailyData = await prisma.$queryRaw<
      { date: Date; total_revenue: number; source: string }[]
    >`
      SELECT DATE("createdAt") as date, SUM("total") as total_revenue, 'ORDER' as source
      FROM "orders"
      WHERE "status" NOT IN ('REFUNDED', 'CANCELLED')
      AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE("createdAt")
      
      UNION ALL
      
      SELECT DATE("createdAt") as date, SUM("total") as total_revenue, 'SALE' as source
      FROM "sales"
      WHERE "status" != 'REFUNDED'
      AND "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY DATE("createdAt")
      
      ORDER BY date DESC
    `;

    // Consolidar resultados en memoria para enviar al cliente
    const consolidated = dailyData.reduce((acc, curr) => {
      // Prisma queryRaw devuelve Date, extraemos la fecha local (YYYY-MM-DD)
      const dateStr = curr.date.toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, E_COMMERCE: 0, POS: 0, TOTAL: 0 };
      
      const revenue = Number(curr.total_revenue) || 0;
      if (curr.source === 'ORDER') acc[dateStr].E_COMMERCE += revenue;
      if (curr.source === 'SALE') acc[dateStr].POS += revenue;
      
      acc[dateStr].TOTAL += revenue;
      return acc;
    }, {} as Record<string, { date: string, E_COMMERCE: number, POS: number, TOTAL: number }>);

    return Object.values(consolidated);
  }

  async getTopProducts(limit: number = 10) {
    // Para identificar los más vendidos, agrupamos por productName y sumamos las cantidades
    const topSales = await prisma.$queryRaw<
      { name: string; sku: string; total_quantity: bigint; total_revenue: number }[]
    >`
      SELECT "productName" as name, "sku", SUM("quantity") as total_quantity, SUM("totalPrice") as total_revenue
      FROM (
        SELECT "productName", "sku", "quantity", "totalPrice" FROM "order_items" oi
        JOIN "orders" o ON oi."orderId" = o.id WHERE o.status NOT IN ('REFUNDED', 'CANCELLED')
        UNION ALL
        SELECT "productName", "sku", "quantity", "totalPrice" FROM "sale_items" si
        JOIN "sales" s ON si."saleId" = s.id WHERE s.status != 'REFUNDED'
      ) as combined_items
      GROUP BY "productName", "sku"
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `;

    return topSales.map(item => ({
      name: item.name,
      sku: item.sku,
      quantitySold: Number(item.total_quantity),
      revenueGenerated: Number(item.total_revenue)
    }));
  }

  async getInventoryValuation() {
    const inventories = await prisma.inventory.findMany({
      include: {
        product: { select: { name: true, sku: true, price: true, category: { select: { name: true } } } }
      },
      where: { quantity: { gt: 0 } }
    });

    return inventories.map(inv => ({
      productId: inv.productId,
      name: inv.product.name,
      sku: inv.product.sku,
      category: inv.product.category.name,
      quantityOnHand: inv.quantity,
      unitValue: Number(inv.product.price),
      totalValue: inv.quantity * Number(inv.product.price)
    })).sort((a, b) => b.totalValue - a.totalValue);
  }
}