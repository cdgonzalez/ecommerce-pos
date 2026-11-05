import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { OpenShiftDTO, CashMovementDTO, CloseShiftDTO, GetShiftsQueryDTO } from './shifts.schema';
import { auditService, AuditActions } from '../audit/audit.service';
import { buildPaginationMeta } from '../../core/utils/pagination';

export class ShiftsService {
  async openShift(cashierId: string, data: OpenShiftDTO) {
    if (data.initialCash < 0) {
      throw new AppError('Initial cash must be non-negative', 400);
    }

    const existingOpenShift = await prisma.shift.findFirst({
      where: { cashierId, status: 'OPEN' }
    });

    if (existingOpenShift) {
      throw new AppError('Cashier already has an active open shift', 409);
    }

    const shift = await prisma.shift.create({
      data: {
        cashierId,
        initialCash: data.initialCash,
        status: 'OPEN',
        openedAt: new Date()
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } }
      }
    });

    await auditService.logAction({
      userId: cashierId,
      action: AuditActions.SHIFT_OPENED,
      entity: 'Shift',
      entityId: shift.id,
      metadata: { initialCash: data.initialCash }
    });

    return shift;
  }

  async getCurrentShift(cashierId: string) {
    return prisma.shift.findFirst({
      where: { cashierId, status: 'OPEN' },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        movements: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  async addCashMovement(shiftId: string, userId: string, data: CashMovementDTO) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });

    if (!shift || shift.status !== 'OPEN') {
      throw new AppError('Shift not found or already closed', 400);
    }

    if (data.amount <= 0) {
      throw new AppError('Movement amount must be greater than zero', 400);
    }

    const movement = await prisma.cashMovement.create({
      data: {
        shiftId: shift.id,
        userId,
        type: data.type,
        amount: data.amount,
        reason: data.reason
      }
    });

    await auditService.logAction({
      userId,
      action: AuditActions.CASH_MOVEMENT_CREATED,
      entity: 'CashMovement',
      entityId: movement.id,
      metadata: { shiftId: shift.id, type: data.type, amount: data.amount, reason: data.reason }
    });

    return movement;
  }

  async closeShift(shiftId: string, userId: string, data: CloseShiftDTO) {
    if (data.countedCash < 0) {
      throw new AppError('Counted cash must be non-negative', 400);
    }

    return prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id: shiftId },
        include: {
          sales: {
            include: { payments: true }
          },
          movements: true
        }
      });

      if (!shift || shift.status !== 'OPEN') {
        throw new AppError('Shift not found or already closed', 400);
      }

      // Calculate cash sales
      let cashSales = 0;
      for (const sale of shift.sales) {
        if (sale.status !== 'REFUNDED') {
          for (const payment of sale.payments) {
            if (payment.method === 'CASH' && payment.status === 'COMPLETED') {
              cashSales += Number(payment.amount);
            }
          }
        }
      }

      // Calculate movements
      let cashInTotal = 0;
      let cashOutTotal = 0;
      for (const movement of shift.movements) {
        if (movement.type === 'CASH_IN') {
          cashInTotal += Number(movement.amount);
        } else if (movement.type === 'CASH_OUT') {
          cashOutTotal += Number(movement.amount);
        }
      }

      const initialCash = Number(shift.initialCash);
      const expectedCash = initialCash + cashSales + cashInTotal - cashOutTotal;
      const countedCash = Number(data.countedCash);
      const variance = countedCash - expectedCash;

      const closedShift = await tx.shift.update({
        where: { id: shift.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          expectedCash,
          countedCash,
          variance,
          notes: data.notes || null
        },
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          movements: true
        }
      });

      await auditService.logAction({
        userId,
        action: AuditActions.SHIFT_CLOSED_CORTE_Z,
        entity: 'Shift',
        entityId: closedShift.id,
        metadata: {
          initialCash,
          cashSales,
          cashInTotal,
          cashOutTotal,
          expectedCash,
          countedCash,
          variance
        }
      });

      return closedShift;
    });
  }

  async getShifts(query: GetShiftsQueryDTO) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.cashierId) where.cashierId = query.cashierId;
    if (query.status) where.status = query.status;

    const [total, shifts] = await Promise.all([
      prisma.shift.count({ where }),
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        include: {
          cashier: { select: { id: true, name: true, email: true } }
        },
        orderBy: { openedAt: 'desc' }
      })
    ]);

    return {
      shifts,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  async getShiftSummary(shiftId: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        sales: {
          include: {
            payments: true,
            items: true
          }
        },
        movements: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let subtotal = 0;
    let taxes = 0;
    let totalSales = 0;

    for (const sale of shift.sales) {
      if (sale.status !== 'REFUNDED') {
        subtotal += Number(sale.subtotal);
        taxes += Number(sale.taxes);
        totalSales += Number(sale.total);

        for (const payment of sale.payments) {
          if (payment.status === 'COMPLETED') {
            const amount = Number(payment.amount);
            if (payment.method === 'CASH') cashSales += amount;
            else if (payment.method === 'CARD' || payment.method === 'CREDIT_CARD' || payment.method === 'DEBIT_CARD') cardSales += amount;
            else transferSales += amount;
          }
        }
      }
    }

    let cashInTotal = 0;
    let cashOutTotal = 0;
    for (const mov of shift.movements) {
      if (mov.type === 'CASH_IN') cashInTotal += Number(mov.amount);
      if (mov.type === 'CASH_OUT') cashOutTotal += Number(mov.amount);
    }

    const initialCash = Number(shift.initialCash);
    const expectedCash = shift.expectedCash !== null ? Number(shift.expectedCash) : (initialCash + cashSales + cashInTotal - cashOutTotal);
    const countedCash = shift.countedCash !== null ? Number(shift.countedCash) : null;
    const variance = shift.variance !== null ? Number(shift.variance) : null;

    return {
      shift: {
        id: shift.id,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        cashier: shift.cashier,
        notes: shift.notes
      },
      cashDrawer: {
        initialCash,
        cashSales,
        cashInTotal,
        cashOutTotal,
        expectedCash,
        countedCash,
        variance
      },
      salesSummary: {
        totalTransactions: shift.sales.length,
        subtotal,
        taxes,
        totalSales,
        byPaymentMethod: {
          cash: cashSales,
          card: cardSales,
          transfer: transferSales
        }
      },
      movements: shift.movements
    };
  }
}
