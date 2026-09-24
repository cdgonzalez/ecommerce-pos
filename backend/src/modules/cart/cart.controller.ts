import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service';

const cartService = new CartService();

export const validateCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cartService.validateCart(req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};