import { Request, Response, NextFunction } from 'express';
import { ShiftsService } from './shifts.service';

const shiftsService = new ShiftsService();

export const openShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cashierId = req.user!.id;
    const shift = await shiftsService.openShift(cashierId, req.body);
    res.status(201).json({
      status: 'success',
      data: shift
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cashierId = req.user!.id;
    const shift = await shiftsService.getCurrentShift(cashierId);
    res.status(200).json({
      status: 'success',
      data: shift
    });
  } catch (error) {
    next(error);
  }
};

export const addCashMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const shiftId = req.params.id as string;
    const movement = await shiftsService.addCashMovement(shiftId, userId, req.body);
    res.status(201).json({
      status: 'success',
      data: movement
    });
  } catch (error) {
    next(error);
  }
};

export const closeShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const shiftId = req.params.id as string;
    const closedShift = await shiftsService.closeShift(shiftId, userId, req.body);
    res.status(200).json({
      status: 'success',
      data: closedShift
    });
  } catch (error) {
    next(error);
  }
};

export const getShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await shiftsService.getShifts(req.query as any);
    res.status(200).json({
      status: 'success',
      data: result.shifts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shiftId = req.params.id as string;
    const summary = await shiftsService.getShiftSummary(shiftId);
    res.status(200).json({
      status: 'success',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

