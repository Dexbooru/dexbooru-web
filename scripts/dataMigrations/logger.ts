import winston from 'winston';

const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.simple(),
		winston.format.printf(({ message, level, timestamp, ...meta }) => {
			const stringifiedMeta = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
			return `${timestamp} ${level}: ${message}${stringifiedMeta}`;
		}),
	),
	transports: [new winston.transports.Console()],
});

export default logger;
