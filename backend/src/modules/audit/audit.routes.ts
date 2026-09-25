import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';

const router = Router();

router.use(protect);
router.use(requirePermission('MANAGE_ROLES')); // Requiere un permiso de muy alto nivel

router.get('/', getAuditLogs);

export default router;