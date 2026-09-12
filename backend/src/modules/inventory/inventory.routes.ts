import { Router } from 'express';
import { getInventory, adjustStock } from './inventory.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { adjustStockSchema } from './inventory.schema';

const router = Router();

// Todas las rutas de inventario son estrictamente administrativas
router.use(protect);

router.get('/', requirePermission('VIEW_INVENTORY'), getInventory);
router.post('/adjust', requirePermission('MANAGE_PRODUCTS'), validateRequest(adjustStockSchema), adjustStock);

export default router;