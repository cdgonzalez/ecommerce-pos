import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: ZodType, target: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      if (target === 'body') {
        req.body = parsed;
      } else if (target === 'query') {
        Object.assign(req.query, parsed);
      }
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
