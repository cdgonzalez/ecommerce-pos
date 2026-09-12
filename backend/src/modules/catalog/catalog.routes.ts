import { Router } from 'express';
import { 
  getCategories, createCategory, 
  getProducts, getProductBySlug, createProduct 
} from './catalog.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createCategorySchema, createProductSchema } from './catalog.schema';

const router = Router();

// Rutas Públicas (E-Commerce)
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

// Rutas Protegidas (Administración)
router.use(protect);
router.post('/categories', requirePermission('MANAGE_PRODUCTS'), validateRequest(createCategorySchema), createCategory);
router.post('/products', requirePermission('MANAGE_PRODUCTS'), validateRequest(createProductSchema), createProduct);

export default router;