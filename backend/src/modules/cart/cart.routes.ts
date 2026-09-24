import { Router } from 'express';
import { validateCart } from './cart.controller';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { validateCartSchema } from './cart.schema';

const router = Router();

router.post('/validate', validateRequest(validateCartSchema), validateCart);

export default router;