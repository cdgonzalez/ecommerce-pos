import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';

const router = Router();

router.use(protect);
router.use(requirePermission('VIEW_REPORTS'));

router.get('/', getDashboardData);

export default router;