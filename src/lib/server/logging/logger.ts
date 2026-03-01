import winston from 'winston';
import formatData from './formatters';

const loggerOptions: winston.LoggerOptions = {
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.simple(),
		formatData,
	),
	transports: [new winston.transports.Console()],
};

const logger = winston.createLogger(loggerOptions);

export default logger;
