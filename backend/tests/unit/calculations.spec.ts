import { describe, it, expect } from 'vitest';

interface CartItem {
  productId: string;
  unitPrice: number;
  quantity: number;
}

export function calculateOrderFinancials(items: CartItem[], taxRate: number = 0.16) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const taxes = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + taxes).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxes,
    total,
  };
}

describe('Financial Calculations: Totals, Taxes (IVA 16%), and Invariant Snapshots', () => {
  it('should accurately calculate subtotal, 16% taxes, and total for a single product', () => {
    const items: CartItem[] = [
      { productId: 'prod-1', unitPrice: 100.0, quantity: 2 },
    ];

    const result = calculateOrderFinancials(items);

    expect(result.subtotal).toBe(200.0);
    expect(result.taxes).toBe(32.0); // 200 * 0.16
    expect(result.total).toBe(232.0);
  });

  it('should calculate multiple products with fractional prices and proper rounding', () => {
    const items: CartItem[] = [
      { productId: 'prod-1', unitPrice: 19.99, quantity: 3 }, // 59.97
      { productId: 'prod-2', unitPrice: 49.50, quantity: 1 }, // 49.50
    ];

    const result = calculateOrderFinancials(items);

    expect(result.subtotal).toBe(109.47);
    expect(result.taxes).toBe(17.52); // 109.47 * 0.16 = 17.5152 -> 17.52
    expect(result.total).toBe(126.99); // 109.47 + 17.52
  });

  it('should preserve immutable unitPrice snapshot when product price changes later in catalog', () => {
    const catalogProduct = {
      id: 'prod-1',
      name: 'Sneakers',
      currentPrice: 120.0,
    };

    // Sale performed when price was 100.00
    const historicalSaleItem = {
      productId: catalogProduct.id,
      productName: catalogProduct.name,
      unitPrice: 100.0,
      quantity: 2,
      totalPrice: 200.0,
    };

    // Subsequent price bump in catalog
    catalogProduct.currentPrice = 150.0;

    // Snapshot remains immutable
    expect(historicalSaleItem.unitPrice).toBe(100.0);
    expect(historicalSaleItem.totalPrice).toBe(200.0);
    expect(historicalSaleItem.unitPrice).not.toBe(catalogProduct.currentPrice);
  });
});

