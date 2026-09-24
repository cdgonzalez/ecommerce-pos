import { Router } from 'express';
import { getHistory, processRefund } from './transactions.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { processRefundSchema } from './transactions.schema';

const router = Router();

router.use(protect);

// Historial visible para roles financieros y gerenciales
router.get('/', requirePermission('VIEW_REPORTS'), getHistory);

// Reembolsos estrictamente protegidos para roles superiores
router.post('/refund', requirePermission('MANAGE_PRODUCTS'), validateRequest(processRefundSchema), processRefund);

export default router;