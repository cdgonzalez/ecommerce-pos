import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';

// Extender el Request de Express para incluir el usuario decodificado
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const validateRequest = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // En Zod 4 la propiedad recomendada para iterar problemas es .issues
        const errorMessages = error.issues
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(new AppError(`Validation Error: ${errorMessages}`, 400));
      } else {
        next(error);
      }
    }
  };
};

export const protect = (req: Request, _res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string };
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid token or token has expired', 401));
  }
};