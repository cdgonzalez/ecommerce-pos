import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service';

const ordersService = new OrdersService();

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id; // Garantizado por protect middleware
    const order = await ordersService.createOrder(userId, req.body);
    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orders = await ordersService.getUserOrders(userId);
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
};