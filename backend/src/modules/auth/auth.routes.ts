import { Router } from "express";
import { login, register } from "./auth.controller";
import { validateRequest } from "../../core/middlewares/validate.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import { authLimiter } from "../../core/middlewares/ratelimit.middleware";

const router = Router();

// Aplicamos el limitador de autenticación a las rutas de registro y login
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);

export default router;
