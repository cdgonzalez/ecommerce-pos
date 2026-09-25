import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// Instancia global para almacenar el contexto asíncrono
export const requestContext = new AsyncLocalStorage<string>();

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Exponer el ID en la respuesta para el cliente frontend
  res.setHeader('X-Request-Id', requestId);

  // Ejecutar el resto de la cadena de Express dentro del contexto de este Request ID
  requestContext.run(requestId, () => {
    next();
  });
};