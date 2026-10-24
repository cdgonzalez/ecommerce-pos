import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { logs, pagination } = await auditService.getAuditLogs({ page, limit });
    res.status(200).json({ status: 'success', data: logs, pagination });
  } catch (error) {
    next(error);
  }
};
