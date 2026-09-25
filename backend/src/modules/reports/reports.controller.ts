import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export const getDailySalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportsService.getDailySales({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getTopProductsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await reportsService.getTopProducts(limit);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getInventoryValuationReport = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportsService.getInventoryValuation();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};