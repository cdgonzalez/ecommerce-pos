import { Router } from 'express';
import { createCustomer, getCustomers, getCustomerById, getMyProfile, updateMyProfile } from './customers.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createCustomerSchema, updateMyProfileSchema } from './customers.schema';

const router = Router();

// Acceso protegido para operadores y admins
router.use(protect);

// RUTAS B2C (Cualquier usuario logueado puede acceder a su propio perfil)
router.get('/my-profile', getMyProfile);
router.put('/my-profile', validateRequest(updateMyProfileSchema), updateMyProfile);

// RUTAS B2B (Requieren permiso administrativo)
// Se crea un sub-enrutador para aplicar el middleware RBAC solo a estas rutas
const adminRouter = Router();
adminRouter.use(requirePermission('PROCESS_SALES'));
adminRouter.get('/', getCustomers);
adminRouter.get('/:id', getCustomerById);
adminRouter.post('/', validateRequest(createCustomerSchema), createCustomer);

router.use('/', adminRouter);

export default router;