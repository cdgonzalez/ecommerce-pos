import { Router } from 'express';
import { login, register } from './auth.controller';
import { validateRequest } from '../../core/middlewares/validate.middleware';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

export default router;