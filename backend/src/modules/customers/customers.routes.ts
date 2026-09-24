import { Router } from 'express';
import { createCustomer, getCustomers, getCustomerById } from './customers.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createCustomerSchema } from './customers.schema';

const router = Router();

// Acceso protegido para operadores y admins
router.use(protect);
router.use(requirePermission('PROCESS_SALES')); // Cajeros y admins pueden gestionar clientes

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', validateRequest(createCustomerSchema), createCustomer);

export default router;