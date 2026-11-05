import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/core/database/prisma.client';
import { generateTestAccessToken } from '../helpers/auth.helper';
import { createMockOrder } from '../helpers/order.helper';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findUnique: vi.fn(),
      },
      userRole: {
        findMany: vi.fn(),
      },
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

describe('Orders API Integration Tests (Supertest)', () => {
  const adminToken = generateTestAccessToken('admin-user-uuid');

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock user for auth middleware
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin-user-uuid',
      name: 'Admin User',
      email: 'admin@example.com',
      isActive: true,
      roles: []
    } as any);

    // Mock user roles and permissions for rbac middleware
    vi.mocked(prisma.userRole.findMany).mockResolvedValue([
      {
        userId: 'admin-user-uuid',
        roleId: 'admin-role-id',
        role: {
          id: 'admin-role-id',
          name: 'ADMIN',
          permissions: [
            {
              permission: {
                name: 'PROCESS_SALES'
              }
            }
          ]
        }
      }
    ] as any);
  });

  describe('GET /api/v1/orders', () => {
    it('should return 401 Unauthorized if no auth token is provided', async () => {
      const response = await request(app).get('/api/v1/orders');
      expect(response.status).toBe(401);
    });

    it('should return 200 with orders array and pagination metadata', async () => {
      const mockOrder = createMockOrder();
      vi.mocked(prisma.order.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([mockOrder] as any);

      const response = await request(app)
        .get('/api/v1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return 200 with full order details when found', async () => {
      const mockOrder = createMockOrder({ id: 'order-123' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .get('/api/v1/orders/order-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('order-123');
    });

    it('should return 404 when order does not exist', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/orders/non-existent-order')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should return 200 and update status when valid', async () => {
      const existingOrder = createMockOrder({ id: 'order-123', status: 'CONFIRMED' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...existingOrder,
        status: 'PROCESSING'
      } as any);

      const response = await request(app)
        .patch('/api/v1/orders/order-123/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('PROCESSING');
    });

    it('should return 400 when attempting transition to SHIPPED without carrier and tracking', async () => {
      const existingOrder = createMockOrder({ id: 'order-123', status: 'PROCESSING' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);

      const response = await request(app)
        .patch('/api/v1/orders/order-123/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/carrier and tracking number are mandatory/i);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should return 200 and restore inventory when cancelling active order', async () => {
      const existingOrder = createMockOrder({ id: 'order-123', status: 'PROCESSING' });
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(existingOrder as any);
      vi.mocked(prisma.inventory.findUnique).mockResolvedValueOnce({ id: 'inv-1', quantity: 5 } as any);
      vi.mocked(prisma.inventory.update).mockResolvedValueOnce({ id: 'inv-1', quantity: 7 } as any);
      vi.mocked(prisma.stockMovement.create).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({ ...existingOrder, status: 'CANCELLED' } as any);
      vi.mocked(prisma.payment.updateMany).mockResolvedValueOnce({ count: 1 } as any);

      const response = await request(app)
        .post('/api/v1/orders/order-123/cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cancellationReason: 'Buyer changed their mind before shipment' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});
