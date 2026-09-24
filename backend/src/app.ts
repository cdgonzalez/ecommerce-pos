import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './core/utils/logger';
import { errorHandler } from './core/middlewares/error.middleware';
import { AppError } from './core/utils/AppError';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import customersRoutes from './modules/customers/customers.routes';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Middlewares globales base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// HTTP Request Logging (derivado a Winston)
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// V1 Router Prefix Setup
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/catalog', catalogRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/customers', customersRoutes);

// Health Check Endpoint
v1Router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'E-Commerce POS API v1 is running',
    timestamp: new Date().toISOString()
  });
});

// Registrar router principal
app.use('/api/v1', v1Router);

// Manejo de rutas inexistentes (404)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Middleware Global de Manejo de Errores
app.use(errorHandler);

export default app;