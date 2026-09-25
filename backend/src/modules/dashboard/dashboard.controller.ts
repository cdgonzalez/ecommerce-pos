import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export const getDashboardData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.status(200).json({ status: 'success', data: metrics });
  } catch (error) {
    next(error);
  }
};