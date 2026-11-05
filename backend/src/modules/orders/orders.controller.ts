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

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ordersService.getOrders(req.query as any);
    res.status(200).json({
      status: 'success',
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.getOrderById(req.params.id as string);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const order = await ordersService.updateOrderStatus(req.params.id as string, req.body, adminId);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const result = await ordersService.cancelOrder(req.params.id as string, req.body, adminId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
