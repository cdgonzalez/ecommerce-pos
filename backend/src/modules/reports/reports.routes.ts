import { Router } from 'express';
import { getDailySalesReport, getTopProductsReport, getInventoryValuationReport } from './reports.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { dateRangeSchema } from './reports.schema';

const router = Router();

router.use(protect);
router.use(requirePermission('VIEW_REPORTS'));

router.get('/sales', validateRequest(dateRangeSchema), getDailySalesReport);
router.get('/top-products', getTopProductsReport);
router.get('/inventory-valuation', getInventoryValuationReport);

export default router;