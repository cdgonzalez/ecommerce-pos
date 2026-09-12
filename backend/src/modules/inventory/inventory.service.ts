import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { AdjustStockDTO } from './inventory.schema';

export class InventoryService {
  async getInventory(queryParams: { lowStock?: boolean }) {
    const { lowStock } = queryParams;

    // Auto-inicializar cualquier producto que aún no tenga registro en la tabla inventories
    const productsWithoutInventory = await prisma.product.findMany({
      where: { inventory: null },
      select: { id: true },
    });

    if (productsWithoutInventory.length > 0) {
      await prisma.inventory.createMany({
        data: productsWithoutInventory.map((p) => ({
          productId: p.id,
          quantity: 0,
          minStock: 5,
        })),
        skipDuplicates: true,
      });
    }

    const whereClause = lowStock 
      ? { quantity: { lte: prisma.inventory.fields.minStock } }
      : {};

    return prisma.inventory.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, sku: true, price: true }
        }
      },
      orderBy: { quantity: 'asc' }
    });
  }

  async adjustStock(data: AdjustStockDTO, userId?: string) {
    // Transacción para garantizar consistencia atómica
    return prisma.$transaction(async (tx) => {
      // 1. Asegurar que el inventario exista para el producto
      let inventory = await tx.inventory.findUnique({
        where: { productId: data.productId }
      });

      if (!inventory) {
        // Inicialización perezosa si el producto fue creado sin inventario explícito
        const product = await tx.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new AppError('Product not found', 404);

        inventory = await tx.inventory.create({
          data: { productId: data.productId, quantity: 0 }
        });
      }

      // 2. Registrar el movimiento
      await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          userId: userId
        }
      });

      // 3. Actualizar el consolidado de forma atómica
      const operation = data.type === 'IN' || data.type === 'ADJUST' 
        ? { increment: data.quantity }
        : { decrement: data.quantity };

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: operation },
        include: { product: { select: { name: true, sku: true } } }
      });

      // 4. Validación estricta post-operación (Prevenir over-selling)
      if (updatedInventory.quantity < 0) {
        throw new AppError(`Insufficient stock for product ${updatedInventory.product.name}. Current stock: ${inventory.quantity}`, 400);
      }

      return updatedInventory;
    });
  }
}