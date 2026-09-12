import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';

const inventoryService = new InventoryService();

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lowStock = req.query.lowStock === 'true';
    const inventory = await inventoryService.getInventory({ lowStock });
    res.status(200).json({ status: 'success', data: inventory });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // Inyectado por protect middleware
    const updatedInventory = await inventoryService.adjustStock(req.body, userId);
    res.status(200).json({ status: 'success', data: updatedInventory });
  } catch (error) {
    next(error);
  }
};