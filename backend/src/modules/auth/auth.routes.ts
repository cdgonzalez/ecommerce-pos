import { Router } from "express";
import { login, register, refreshToken, logout } from "./auth.controller";
import { validateRequest } from "../../core/middlewares/validate.middleware";
import { loginSchema, registerSchema, refreshTokenSchema, logoutSchema } from "./auth.schema";
import { authLimiter } from "../../core/middlewares/ratelimit.middleware";
import { protect } from "../../core/middlewares/auth.middleware";

const router = Router();

// Aplicamos el limitador de autenticación a las rutas de registro y login
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh-token", authLimiter, validateRequest(refreshTokenSchema), refreshToken);
router.post("/logout", validateRequest(logoutSchema), (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, () => logout(req, res, next));
  }
  return logout(req, res, next);
});

export default router;
