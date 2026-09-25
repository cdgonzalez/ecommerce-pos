import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await usersService.getAllRoles();
    res.status(200).json({ status: 'success', data: roles });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newUser = await usersService.createUser(req.body);
    res.status(201).json({ status: 'success', data: newUser });
  } catch (error) {
    next(error);
  }
};