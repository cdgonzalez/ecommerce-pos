import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service';

const catalogService = new CatalogService();

// Categories
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await catalogService.getCategories();
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await catalogService.createCategory(req.body);
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

// Products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { products, pagination } = await catalogService.getProducts(req.query);
    res.status(200).json({ status: 'success', data: products, pagination });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await catalogService.getProductBySlug(req.params.slug as string);
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await catalogService.createProduct(req.body);
    res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};
