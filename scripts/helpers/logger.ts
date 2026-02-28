import winston from 'winston';

export type TLogLevel = 'debug' | 'info' | 'warn' | 'error';

const buildLogger = (logLevel: TLogLevel) => {
	return winston.createLogger({
		level: logLevel,
		format: winston.format.combine(
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			winston.format.colorize({ all: true }),
			winston.format.printf(({ timestamp, level, message, ...meta }) => {
				const metadataStr =
					Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
				return `[${timestamp}] ${level}: ${message}${metadataStr}`;
			}),
		),
		transports: [new winston.transports.Console()],
	});
};

export default buildLogger;
