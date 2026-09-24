import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service';

const customersService = new CustomersService();

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const customers = await customersService.getCustomers(search);
    res.status(200).json({ status: 'success', data: customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customersService.getCustomerById(req.params.id as string);
    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
};