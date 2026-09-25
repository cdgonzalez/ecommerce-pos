import winston from 'winston';
import { requestContext } from '../middlewares/correlation.middleware';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      // Extraemos el Request ID sin necesidad de pasarlo por argumentos
      const reqId = requestContext.getStore();
      const reqIdString = reqId ? `[ReqID: ${reqId}] ` : '';
      return `${info.timestamp} ${info.level}: ${reqIdString}${info.message}`;
    }
  )
);

const transports = [
  new winston.transports.Console(),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;