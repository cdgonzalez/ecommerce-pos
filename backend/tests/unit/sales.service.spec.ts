import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../../src/core/database/prisma.client';
import { SalesService } from '../../src/modules/sales/sales.service';
import { AppError } from '../../src/core/utils/AppError';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      shift: {
        findFirst: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
      inventory: {
        updateMany: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      sale: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      payment: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

vi.mock('../../src/core/cache/redis.client', () => {
  return {
    default: {
      isOpen: false,
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('SalesService Unit Tests (Shift Binding)', () => {
  let salesService: SalesService;

  beforeEach(() => {
    salesService = new SalesService();
    vi.clearAllMocks();
  });

  it('should throw AppError 400 if cashier does not have an active open shift', async () => {
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null);

    await expect(
      salesService.processSale('cashier-1', {
        items: [{ productId: 'prod-1', quantity: 2 }],
        paymentMethod: 'CASH',
      })
    ).rejects.toThrow(
      'No active open shift found for cashier. Open a shift before processing sales.'
    );
  });

  it('should link sale to active shiftId when open shift exists', async () => {
    const mockShift = { id: 'shift-open-1', cashierId: 'cashier-1', status: 'OPEN' };
    vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(mockShift as any);

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: 'prod-1',
      name: 'Test Product',
      sku: 'SKU-001',
      price: 100 as any,
      status: 'ACTIVE',
      inventory: { id: 'inv-1', quantity: 10 },
    } as any);

    vi.mocked(prisma.inventory.updateMany).mockResolvedValueOnce({ count: 1 } as any);
    vi.mocked(prisma.stockMovement.create).mockResolvedValueOnce({} as any);

    const mockSale = {
      id: 'sale-1',
      cashierId: 'cashier-1',
      shiftId: 'shift-open-1',
      subtotal: 200,
      taxes: 32,
      total: 232,
    };
    vi.mocked(prisma.sale.create).mockResolvedValueOnce(mockSale as any);
    vi.mocked(prisma.payment.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce(mockSale as any);

    const result = await salesService.processSale('cashier-1', {
      items: [{ productId: 'prod-1', quantity: 2 }],
      paymentMethod: 'CASH',
    });

    expect(prisma.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashierId: 'cashier-1',
          shiftId: 'shift-open-1',
        }),
      })
    );
    expect(result).toEqual(mockSale);
  });
});

