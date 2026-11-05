import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../../src/core/database/prisma.client';
import { ShiftsService } from '../../src/modules/shifts/shifts.service';
import { AppError } from '../../src/core/utils/AppError';
import { auditService, AuditActions } from '../../src/modules/audit/audit.service';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      shift: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      cashMovement: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
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

describe('ShiftsService Unit Tests', () => {
  let shiftsService: ShiftsService;

  beforeEach(() => {
    shiftsService = new ShiftsService();
    vi.clearAllMocks();
  });

  describe('openShift (US1)', () => {
    it('should throw AppError 400 if initialCash is negative', async () => {
      await expect(
        shiftsService.openShift('cashier-1', { initialCash: -10 })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 409 if cashier already has an active open shift', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce({
        id: 'shift-open-1',
        cashierId: 'cashier-1',
        status: 'OPEN',
      } as any);

      await expect(
        shiftsService.openShift('cashier-1', { initialCash: 100 })
      ).rejects.toThrow(AppError);
    });

    it('should create a new shift and log audit action when valid', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null);
      const mockShift = {
        id: 'shift-new-1',
        cashierId: 'cashier-1',
        initialCash: 150,
        status: 'OPEN',
        openedAt: new Date(),
        cashier: { id: 'cashier-1', name: 'Cashier One', email: 'c1@example.com' },
      };
      vi.mocked(prisma.shift.create).mockResolvedValueOnce(mockShift as any);

      const result = await shiftsService.openShift('cashier-1', { initialCash: 150 });

      expect(result).toEqual(mockShift);
      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          cashierId: 'cashier-1',
          initialCash: 150,
          status: 'OPEN',
          openedAt: expect.any(Date),
        },
        include: {
          cashier: { select: { id: true, name: true, email: true } },
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'cashier-1',
        action: AuditActions.SHIFT_OPENED,
        entity: 'Shift',
        entityId: 'shift-new-1',
        metadata: { initialCash: 150 },
      });
    });
  });

  describe('getCurrentShift (US1)', () => {
    it('should return the active open shift if present', async () => {
      const mockShift = {
        id: 'shift-1',
        cashierId: 'cashier-1',
        status: 'OPEN',
      };
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(mockShift as any);

      const result = await shiftsService.getCurrentShift('cashier-1');
      expect(result).toEqual(mockShift);
      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { cashierId: 'cashier-1', status: 'OPEN' },
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          movements: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    it('should return null if no active open shift exists', async () => {
      vi.mocked(prisma.shift.findFirst).mockResolvedValueOnce(null);

      const result = await shiftsService.getCurrentShift('cashier-1');
      expect(result).toBeNull();
    });
  });

  describe('addCashMovement (US2)', () => {
    it('should throw AppError 400 if shift does not exist or is not OPEN', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce(null);

      await expect(
        shiftsService.addCashMovement('shift-1', 'cashier-1', {
          type: 'CASH_OUT',
          amount: 50,
          reason: 'Sangria a boveda',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 400 if movement amount is zero or negative', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce({
        id: 'shift-1',
        status: 'OPEN',
      } as any);

      await expect(
        shiftsService.addCashMovement('shift-1', 'cashier-1', {
          type: 'CASH_OUT',
          amount: 0,
          reason: 'Invalido',
        })
      ).rejects.toThrow(AppError);
    });

    it('should create cash movement and record audit action', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce({
        id: 'shift-1',
        status: 'OPEN',
      } as any);

      const mockMovement = {
        id: 'movement-1',
        shiftId: 'shift-1',
        userId: 'cashier-1',
        type: 'CASH_OUT',
        amount: 200,
        reason: 'Traslado a bóveda',
        createdAt: new Date(),
      };
      vi.mocked(prisma.cashMovement.create).mockResolvedValueOnce(mockMovement as any);

      const result = await shiftsService.addCashMovement('shift-1', 'cashier-1', {
        type: 'CASH_OUT',
        amount: 200,
        reason: 'Traslado a bóveda',
      });

      expect(result).toEqual(mockMovement);
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'cashier-1',
        action: AuditActions.CASH_MOVEMENT_CREATED,
        entity: 'CashMovement',
        entityId: 'movement-1',
        metadata: {
          shiftId: 'shift-1',
          type: 'CASH_OUT',
          amount: 200,
          reason: 'Traslado a bóveda',
        },
      });
    });
  });

  describe('closeShift (US3)', () => {
    it('should throw AppError 400 if countedCash is negative', async () => {
      await expect(
        shiftsService.closeShift('shift-1', 'cashier-1', { countedCash: -5 })
      ).rejects.toThrow(AppError);
    });

    it('should calculate expectedCash and variance accurately upon closure', async () => {
      const mockShift = {
        id: 'shift-1',
        cashierId: 'cashier-1',
        status: 'OPEN',
        initialCash: 100,
        sales: [
          {
            id: 'sale-1',
            status: 'COMPLETED',
            payments: [{ method: 'CASH', status: 'COMPLETED', amount: 150 }],
          },
          {
            id: 'sale-2',
            status: 'COMPLETED',
            payments: [{ method: 'CARD', status: 'COMPLETED', amount: 300 }],
          },
        ],
        movements: [
          { type: 'CASH_IN', amount: 50 },
          { type: 'CASH_OUT', amount: 30 },
        ],
      };
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce(mockShift as any);

      // Expected cash = 100 (initial) + 150 (cash sale) + 50 (in) - 30 (out) = 270
      // Counted cash = 280
      // Variance = 280 - 270 = +10
      const mockClosedShift = {
        ...mockShift,
        status: 'CLOSED',
        closedAt: new Date(),
        expectedCash: 270,
        countedCash: 280,
        variance: 10,
        notes: 'Sobrante de $10',
      };
      vi.mocked(prisma.shift.update).mockResolvedValueOnce(mockClosedShift as any);

      const result = await shiftsService.closeShift('shift-1', 'cashier-1', {
        countedCash: 280,
        notes: 'Sobrante de $10',
      });

      expect(prisma.shift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'shift-1' },
          data: expect.objectContaining({
            status: 'CLOSED',
            expectedCash: 270,
            countedCash: 280,
            variance: 10,
            notes: 'Sobrante de $10',
          }),
        })
      );
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'cashier-1',
        action: AuditActions.SHIFT_CLOSED_CORTE_Z,
        entity: 'Shift',
        entityId: 'shift-1',
        metadata: {
          initialCash: 100,
          cashSales: 150,
          cashInTotal: 50,
          cashOutTotal: 30,
          expectedCash: 270,
          countedCash: 280,
          variance: 10,
        },
      });
      expect(result.status).toBe('CLOSED');
      expect(result.variance).toBe(10);
    });
  });

  describe('getShifts & getShiftSummary (US4)', () => {
    it('should return paginated shifts with meta', async () => {
      vi.mocked(prisma.shift.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.shift.findMany).mockResolvedValueOnce([
        { id: 'shift-1', status: 'CLOSED' } as any,
      ]);

      const result = await shiftsService.getShifts({ page: 1, limit: 10 });
      expect(result.shifts).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw AppError 404 if shift does not exist in summary', async () => {
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce(null);

      await expect(shiftsService.getShiftSummary('non-existing')).rejects.toThrow(AppError);
    });

    it('should return detailed Corte Z summary breakdown', async () => {
      const mockShift = {
        id: 'shift-1',
        status: 'CLOSED',
        initialCash: 100,
        countedCash: 250,
        expectedCash: 250,
        variance: 0,
        openedAt: new Date('2026-03-01T08:00:00Z'),
        closedAt: new Date('2026-03-01T16:00:00Z'),
        cashier: { id: 'cashier-1', name: 'Cashier One', email: 'c1@example.com' },
        sales: [
          {
            id: 's-1',
            status: 'COMPLETED',
            total: 200,
            taxes: 32,
            items: [
              { productName: 'Producto A', quantity: 2, totalPrice: 100 },
              { productName: 'Producto B', quantity: 1, totalPrice: 100 },
            ],
            payments: [
              { method: 'CASH', amount: 150, status: 'COMPLETED' },
              { method: 'CARD', amount: 50, status: 'COMPLETED' },
            ],
          },
        ],
        movements: [
          { id: 'm-1', type: 'CASH_IN', amount: 20, reason: 'Cambio', createdAt: new Date() },
          { id: 'm-2', type: 'CASH_OUT', amount: 20, reason: 'Bóveda', createdAt: new Date() },
        ],
      };
      vi.mocked(prisma.shift.findUnique).mockResolvedValueOnce(mockShift as any);

      const summary = await shiftsService.getShiftSummary('shift-1');

      expect(summary.shift.id).toBe('shift-1');
      expect(summary.cashDrawer.initialCash).toBe(100);
      expect(summary.salesSummary.byPaymentMethod.cash).toBe(150);
      expect(summary.salesSummary.byPaymentMethod.card).toBe(50);
      expect(summary.salesSummary.totalSales).toBe(200);
      expect(summary.movements).toHaveLength(2);
    });
  });
});
