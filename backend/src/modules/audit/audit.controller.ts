import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await auditService.getAuditLogs(limit);
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    next(error);
  }
};