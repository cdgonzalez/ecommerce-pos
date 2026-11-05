import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/core/database/prisma.client';
import { generateTestAccessToken } from '../helpers/auth.helper';

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
      shift: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      cashMovement: {
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

vi.mock('../../src/modules/audit/audit.service', () => {
  return {
    AuditActions: {
      SHIFT_OPENED: 'SHIFT_OPENED',
      CASH_MOVEMENT_CREATED: 'CASH_MOVEMENT_CREATED',
      SHIFT_CLOSED_CORTE_Z: 'SHIFT_CLOSED_CORTE_Z',
    },
    auditService: {
      logAction: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('Shifts API Integration Tests (Supertest)', () => {
  const cashierToken = generateTestAccessToken('cashier-uuid');

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'cashier-uuid',
      name: 'Cashier User',
      email: 'cashier@example.com',
      isActive: true,
      roles: [],
    } as any);

    vi.mocked(prisma.userRole.findMany).mockResolvedValue([
      {
        userId: 'cashier-uuid',
        roleId: 'cashier-role-id',
        role: {
          id: 'cashier-role-id',
          name: 'CASHIER',
          permissions: [
            { permission: { name: 'PROCESS_SALES' } },
            { permission: { name: 'VIEW_REPORTS' } },
          ],
        },
      },
    ] as any);
  });

  describe('POST /api/v1/shifts/open (US1)', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app).post('/api/v1/shifts/open').send({ initialCash: 100 });
      expect(res.status).toBe(401);
    });

    it('should return 400 if initialCash is negative', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ initialCash: -50 });

      expect(res.status).toBe(400);
    });

    it('should return 201 and create shift if request is valid', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.shift.create).mockResolvedValueOnce({
        id: 'shift-101',
        cashierId: 'cashier-uuid',
        initialCash: 150,
        status: 'OPEN',
        openedAt: new Date(),
        cashier: { id: 'cashier-uuid', name: 'Cashier User', email: 'cashier@example.com' },
      } as any);

      const res = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ initialCash: 150 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('shift-101');
      expect(res.body.data.status).toBe('OPEN');
    });
  });

  describe('GET /api/v1/shifts/current (US1)', () => {
    it('should return 200 with active shift if open', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
        id: 'shift-101',
        status: 'OPEN',
      } as any);

      const res = await request(app)
        .get('/api/v1/shifts/current')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('shift-101');
    });

    it('should return 200 with null if no shift open', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/shifts/current')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe('POST /api/v1/shifts/:id/movements (US2)', () => {
    it('should return 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/shift-101/movements')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ type: 'INVALID_TYPE', amount: 50 });

      expect(res.status).toBe(400);
    });

    it('should return 201 for valid cash movement', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce({
        id: 'shift-101',
        status: 'OPEN',
      } as any);

      vi.mocked(prisma.cashMovement.create).mockResolvedValueOnce({
        id: 'mov-1',
        shiftId: 'shift-101',
        type: 'CASH_OUT',
        amount: 100,
        reason: 'Traslado a bóveda',
      } as any);

      const res = await request(app)
        .post('/api/v1/shifts/shift-101/movements')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ type: 'CASH_OUT', amount: 100, reason: 'Traslado a bóveda' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.amount).toBe(100);
    });
  });

  describe('POST /api/v1/shifts/:id/close (US3)', () => {
    it('should return 400 for negative countedCash', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/shift-101/close')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ countedCash: -10 });

      expect(res.status).toBe(400);
    });

    it('should return 200 with closed shift data upon successful reconciliation', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce({
        id: 'shift-101',
        status: 'OPEN',
        initialCash: 100,
        sales: [],
        movements: [],
      } as any);

      vi.mocked(prisma.shift.update).mockResolvedValueOnce({
        id: 'shift-101',
        status: 'CLOSED',
        initialCash: 100,
        expectedCash: 100,
        countedCash: 100,
        variance: 0,
      } as any);

      const res = await request(app)
        .post('/api/v1/shifts/shift-101/close')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ countedCash: 100, notes: 'Cuadre perfecto' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('CLOSED');
      expect(res.body.data.variance).toBe(0);
    });
  });

  describe('GET /api/v1/shifts and GET /api/v1/shifts/:id/summary (US4)', () => {
    it('should return 200 with paginated shifts list', async () => {
      vi.mocked(prisma.shift.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.shift.findMany).mockResolvedValueOnce([
        { id: 'shift-101', status: 'CLOSED' } as any,
      ]);

      const res = await request(app)
        .get('/api/v1/shifts?page=1&limit=10')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should return 200 with shift summary breakdown', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce({
        id: 'shift-101',
        status: 'CLOSED',
        initialCash: 100,
        countedCash: 200,
        expectedCash: 200,
        variance: 0,
        openedAt: new Date(),
        closedAt: new Date(),
        cashier: { id: 'c-1', name: 'Cashier' },
        sales: [],
        movements: [],
      } as any);

      const res = await request(app)
        .get('/api/v1/shifts/shift-101/summary')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.shift.id).toBe('shift-101');
      expect(res.body.data.cashDrawer).toBeDefined();
    });
  });
});
