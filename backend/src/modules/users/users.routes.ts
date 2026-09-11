import { Router } from 'express';
import { getUsers, createUser } from './users.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createUserSchema } from './users.schema';

const router = Router();

// Todas las rutas de usuarios requieren estar autenticadas
router.use(protect);

// Requiere permiso específico
router.get('/', requirePermission('MANAGE_USERS'), getUsers);
router.post('/', requirePermission('MANAGE_USERS'), validateRequest(createUserSchema), createUser);

export default router;