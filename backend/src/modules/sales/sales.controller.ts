import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';

const salesService = new SalesService();

export const processSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cashierId = req.user!.id; // Garantizado por protect middleware
    const sale = await salesService.processSale(cashierId, req.body);
    res.status(201).json({ status: 'success', data: sale });
  } catch (error) {
    next(error);
  }
};

export const getSalesHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sales = await salesService.getSales(limit);
    res.status(200).json({ status: 'success', data: sales });
  } catch (error) {
    next(error);
  }
};