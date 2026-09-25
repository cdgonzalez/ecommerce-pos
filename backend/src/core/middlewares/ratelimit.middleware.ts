import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';
import { Request, Response, NextFunction } from 'express';

// Límite global: Protege contra DDoS a nivel de aplicación
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, // Límite de 150 peticiones por IP cada 15 minutos
  message: 'Too many requests from this IP, please try again in 15 minutes',
  standardHeaders: true, // Retorna los límites en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
  handler: (_req: Request, _res: Response, next: NextFunction, options) => {
    next(new AppError(options.message, options.statusCode));
  },
});

// Límite estricto para autenticación: Protege contra fuerza bruta y enumeración de usuarios
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Límite de 5 intentos fallidos/exitosos por IP cada hora
  message: 'Too many login attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction, options) => {
    next(new AppError(options.message, options.statusCode));
  },
});