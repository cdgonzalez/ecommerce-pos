import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { ValidateCartDTO } from './cart.schema';

export class CartService {
  async validateCart(data: ValidateCartDTO) {
    let subtotal = 0;
    const validatedItems = [];
    const errors = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true },
      });

      if (!product) {
        errors.push(`Product with ID ${item.productId} not found`);
        continue;
      }

      if (product.status !== 'ACTIVE') {
        errors.push(`Product ${product.name} is no longer available`);
        continue;
      }

      const availableStock = product.inventory?.quantity || 0;
      if (availableStock < item.quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${availableStock}`);
        continue;
      }

      // Convertir Decimal a número para el cálculo seguro en la validación
      const price = Number(product.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: price,
        quantity: item.quantity,
        itemTotal,
      });
    }

    if (errors.length > 0) {
      throw new AppError(`Cart validation failed: ${errors.join(' | ')}`, 400);
    }

    return {
      validatedItems,
      subtotal,
      taxes: subtotal * 0.16, // Ejemplo genérico de IVA (16%), se ajustará en pagos
      total: subtotal * 1.16,
    };
  }
}