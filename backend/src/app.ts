import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './core/utils/logger';
import { errorHandler } from './core/middlewares/error.middleware';
import { AppError } from './core/utils/AppError';
import { correlationMiddleware } from './core/middlewares/correlation.middleware';
import { globalLimiter } from './core/middlewares/ratelimit.middleware';
import prisma from './core/database/prisma.client';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import customersRoutes from './modules/customers/customers.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import salesRoutes from './modules/sales/sales.routes';
import shiftsRoutes from './modules/shifts/shifts.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';

const app: Application = express();

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Necesario para algunas configuraciones de Tailwind/React
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:5173'],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Permite cargar recursos cruzados si es necesario en el E-Commerce
}));

// Rate Limiting Middleware (Global)
app.use("/api", globalLimiter); // Aplica limitación de tasa a todas las rutas bajo /api

// Parcheo contra ataques de polución de parámetros y carga útil masiva
app.use(express.json({ limit: '10kb' })); // Rechaza JSON mayores a 10kb (previene saturación de memoria)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Configuración CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Inyectar correlación antes que cualquier log
app.use(correlationMiddleware); 

// HTTP Request Logging (derivado a Winston)
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// V1 Router Prefix Setup
const v1Router = express.Router();

// DEEP HEALTH CHECK
v1Router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Validar conexión a DB ejecutando query ultra-ligera
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'System Operational',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health Check Failed: Database unreachable');
    res.status(503).json({
      status: 'error',
      message: 'Service Unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

v1Router.use('/auth', authRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/catalog', catalogRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/customers', customersRoutes);
v1Router.use('/cart', cartRoutes);
v1Router.use('/orders', ordersRoutes);
v1Router.use('/sales', salesRoutes);
v1Router.use('/shifts', shiftsRoutes);
v1Router.use('/transactions', transactionsRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/reports', reportsRoutes);
v1Router.use('/audit', auditRoutes);

// Registrar router principal
app.use('/api/v1', v1Router);

// Manejo de rutas inexistentes (404)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Middleware Global de Manejo de Errores
app.use(errorHandler);

export default app;
