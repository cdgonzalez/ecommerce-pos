import { Request, Response, NextFunction } from 'express';
import { TransactionsService } from './transactions.service';

const transactionsService = new TransactionsService();

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { transactions, pagination } = await transactionsService.getUnifiedHistory({ page, limit });
    res.status(200).json({ status: 'success', data: transactions, pagination });
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const result = await transactionsService.processRefund(adminId, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
