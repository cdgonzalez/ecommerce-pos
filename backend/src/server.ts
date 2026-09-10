import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Aquí inicializaremos la conexión a PostgreSQL posteriormente
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting the server:', error);
    process.exit(1);
  }
};

startServer();