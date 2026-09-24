import { Router } from 'express';
import { createOrder, getMyOrders } from './orders.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { createOrderSchema } from './orders.schema';

const router = Router();

// Todas las rutas de órdenes del cliente requieren sesión
router.use(protect);

router.post('/', validateRequest(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);

export default router;