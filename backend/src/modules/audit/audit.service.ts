import prisma from '../../core/database/prisma.client';
import logger from '../../core/utils/logger';

interface CreateAuditLogDTO {
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

  async getAuditLogs(limit: number = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const auditService = new AuditService(); // Instancia exportada para uso transversal