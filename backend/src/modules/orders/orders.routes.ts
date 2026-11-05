import { Router } from 'express';
import { 
  createOrder, 
  getMyOrders, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder 
} from './orders.controller';
import { protect } from '../../core/middlewares/auth.middleware';
import { requirePermission } from '../../core/middlewares/rbac.middleware';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { 
  createOrderSchema, 
  orderQuerySchema, 
  updateOrderStatusSchema, 
  cancelOrderSchema 
} from './orders.schema';

const router = Router();

// Todas las rutas de órdenes requieren sesión
router.use(protect);

// Rutas de cliente (B2C)
router.post('/', validateRequest(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);

// Rutas administrativas (Fulfillment)
const adminRouter = Router();
adminRouter.use(requirePermission('PROCESS_SALES'));

adminRouter.get('/', validateRequest(orderQuerySchema, 'query'), getOrders);
adminRouter.get('/:id', getOrderById);
adminRouter.patch('/:id/status', validateRequest(updateOrderStatusSchema), updateOrderStatus);
adminRouter.post('/:id/cancel', validateRequest(cancelOrderSchema), cancelOrder);

router.use('/', adminRouter);

export default router;
