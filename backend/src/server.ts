import 'dotenv/config';
import app from './app';
import prisma from './core/database/prisma.client';
import logger from './core/utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Verificar conexión a la base de datos
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`; // <-- Obliga a comunicarse con PostgreSQL
    logger.info('📦 Successfully connected to PostgreSQL database');
    
    // 2. Iniciar servidor web solo tras conectar a DB
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Error starting the server or connecting to database:', error);
    // "Invalid `prisma.$queryRaw()` invocation: " es una convención en la que todos los errores que ocurrend durante una consulta los encabeza siempre con este texto "
    // if (error instanceof Error && error.message.startsWith('Invalid `prisma.$queryRaw()` invocation:')) {
    //   logger.error('❌ Database connection failed. Please check your DATABASE_URL in .env and ensure PostgreSQL is running.');
    // }
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();

// Manejo de cierres limpios (Graceful shutdown)
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed due to application termination');
  process.exit(0);
});