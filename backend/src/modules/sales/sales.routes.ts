import { Router } from 'express';
import { processSale, getSalesHistory } from './sales.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createSaleSchema } from './sales.schema';

const router = Router();

router.use(protect);
router.use(requirePermission('PROCESS_SALES'));

router.post('/', validateRequest(createSaleSchema), processSale);
router.get('/', getSalesHistory);

export default router;