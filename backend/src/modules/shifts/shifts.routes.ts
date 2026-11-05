import { Router } from 'express';
import {
  openShift,
  getCurrentShift,
  addCashMovement,
  closeShift,
  getShifts,
  getShiftSummary
} from './shifts.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import {
  openShiftSchema,
  cashMovementSchema,
  closeShiftSchema,
  getShiftsQuerySchema
} from './shifts.schema';

const router = Router();

router.use(protect);

// Cashier POS shift operations
router.post('/open', requirePermission('PROCESS_SALES'), validateRequest(openShiftSchema), openShift);
router.get('/current', requirePermission('PROCESS_SALES'), getCurrentShift);
router.post('/:id/movements', requirePermission('PROCESS_SALES'), validateRequest(cashMovementSchema), addCashMovement);
router.post('/:id/close', requirePermission('PROCESS_SALES'), validateRequest(closeShiftSchema), closeShift);

// Reporting and audit operations
router.get('/', requirePermission('VIEW_REPORTS'), validateRequest(getShiftsQuerySchema, 'query'), getShifts);
router.get('/:id/summary', getShiftSummary);

export default router;

