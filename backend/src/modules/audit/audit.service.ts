import prisma from '../../core/database/prisma.client';
import logger from '../../core/utils/logger';
import { buildPaginationMeta } from '../../core/utils/pagination';

export const AuditActions = {
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  USER_LOGOUT: 'USER_LOGOUT',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  SHIFT_OPENED: 'SHIFT_OPENED',
  CASH_MOVEMENT_CREATED: 'CASH_MOVEMENT_CREATED',
  SHIFT_CLOSED_CORTE_Z: 'SHIFT_CLOSED_CORTE_Z'
} as const;

export interface CreateAuditLogDTO {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
}

export class AuditService {
  async logAction(data: CreateAuditLogDTO) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress
        }
      });
    } catch (error: any) {
      // Un fallo en la auditoría no debe bloquear la transacción principal del usuario,
      // pero debe registrarse como error crítico en el log de aplicación.
      logger.error(`Failed to insert audit log: ${error.message}`);
    }
  }

  async getAuditLogs(params: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      logs,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }
}

export const auditService = new AuditService(); // Instancia exportada para uso transversal
