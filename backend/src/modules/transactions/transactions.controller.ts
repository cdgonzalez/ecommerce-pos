import { Request, Response, NextFunction } from 'express';
import { TransactionsService } from './transactions.service';

const transactionsService = new TransactionsService();

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await transactionsService.getUnifiedHistory(limit);
    res.status(200).json({ status: 'success', data: history });
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