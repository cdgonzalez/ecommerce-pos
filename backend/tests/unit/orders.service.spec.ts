import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../../src/core/database/prisma.client';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { AppError } from '../../src/core/utils/AppError';
import { createMockOrder } from '../helpers/order.helper';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      order: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      inventory: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        updateMany: vi.fn(),
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

vi.mock('../../src/modules/audit/audit.service', () => {
  return {
    auditService: {
      logAction: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('OrdersService Unit Tests', () => {
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService();
    vi.clearAllMocks();
  });

  describe('getOrders (US1)', () => {
    it('should return paginated orders list with correct pagination metadata', async () => {
      const mockOrder = createMockOrder();
      vi.mocked(prisma.order.count).mockResolvedValueOnce(25);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([mockOrder] as any);

      const result = await ordersService.getOrders({ page: 1, limit: 10 });

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('should apply status and search filters when provided', async () => {
      vi.mocked(prisma.order.count).mockResolvedValueOnce(5);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([]);

      await ordersService.getOrders({ page: 1, limit: 10, status: 'PROCESSING', search: 'John' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROCESSING',
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('getOrderById (US1)', () => {
    it('should return order when found', async () => {
      const mockOrder = createMockOrder({ id: 'target-order-id' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);

      const result = await ordersService.getOrderById('target-order-id');

      expect(result.id).toBe('target-order-id');
      expect(result.items).toHaveLength(1);
    });

    it('should throw AppError 404 if order does not exist', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

      await expect(ordersService.getOrderById('missing-id')).rejects.toThrow(AppError);
    });
  });

  describe('updateOrderStatus (US2)', () => {
    it('should successfully transition from PROCESSING to SHIPPED when carrier and tracking are provided', async () => {
      const existingOrder = createMockOrder({ status: 'PROCESSING' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...existingOrder,
        status: 'SHIPPED',
        carrier: 'DHL Express',
        trackingNumber: 'DHL-12345',
      } as any);

      const result = await ordersService.updateOrderStatus(
        'mock-order-uuid-1',
        { status: 'SHIPPED', carrier: 'DHL Express', trackingNumber: 'DHL-12345' },
        'admin-user-id'
      );

      expect(result.status).toBe('SHIPPED');
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SHIPPED',
            carrier: 'DHL Express',
            trackingNumber: 'DHL-12345',
          }),
        })
      );
    });

    it('should reject invalid retrograde transition from SHIPPED to PROCESSING', async () => {
      const existingOrder = createMockOrder({ status: 'SHIPPED' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);

      await expect(
        ordersService.updateOrderStatus('mock-order-uuid-1', { status: 'PROCESSING' as any }, 'admin-user-id')
      ).rejects.toThrow(/Cannot transition order/);
    });

    it('should reject transition to SHIPPED if carrier or trackingNumber is missing', async () => {
      const existingOrder = createMockOrder({ status: 'PROCESSING' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);

      await expect(
        ordersService.updateOrderStatus('mock-order-uuid-1', { status: 'SHIPPED' }, 'admin-user-id')
      ).rejects.toThrow(/Carrier and tracking number are mandatory/);
    });
  });

  describe('cancelOrder (US3)', () => {
    it('should cancel unfulfilled order, restock items atomically, and mark payment refunded', async () => {
      const mockOrder = createMockOrder({ status: 'PROCESSING' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);
      vi.mocked(prisma.inventory.findUnique).mockResolvedValueOnce({ id: 'inv-1', quantity: 10 } as any);
      vi.mocked(prisma.inventory.update).mockResolvedValueOnce({ id: 'inv-1', quantity: 12 } as any);
      vi.mocked(prisma.stockMovement.create).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({ ...mockOrder, status: 'CANCELLED' } as any);
      vi.mocked(prisma.payment.updateMany).mockResolvedValueOnce({ count: 1 } as any);

      const result = await ordersService.cancelOrder(
        mockOrder.id,
        { cancellationReason: 'Customer requested cancellation prior to packing' },
        'admin-user-id'
      );

      expect(result.message).toMatch(/cancelled and stock restored/i);
      expect(prisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: { increment: 2 } },
        })
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'IN',
            quantity: 2,
            userId: 'admin-user-id',
          }),
        })
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'REFUNDED' },
        })
      );
    });

    it('should throw error if attempting to cancel an already SHIPPED or DELIVERED order', async () => {
      const shippedOrder = createMockOrder({ status: 'SHIPPED' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(shippedOrder as any);

      await expect(
        ordersService.cancelOrder(shippedOrder.id, { cancellationReason: 'Late cancel' }, 'admin-id')
      ).rejects.toThrow(/Cannot cancel order that has already been shipped/);
    });
  });
});

