const winston = require('winston');
const env = require('./env');

/**
 * Application logger.
 *
 * Winston gives us log levels, structured metadata and swappable transports.
 * In development we print human-readable colored lines; in production we emit
 * one JSON object per line so log aggregators can parse fields. Tests run with
 * the logger silenced to keep Jest output readable.
 */

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const developmentFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: time, stack }) => {
        return `${time} ${level}: ${message}${stack ? `\n${stack}` : ''}`;
    })
);

const productionFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = winston.createLogger({
    level: env.isTest ? 'silent' : env.logLevel,
    format: env.isProduction ? productionFormat : developmentFormat,
    transports: [new winston.transports.Console()],
    exitOnError: false,
});

module.exports = logger;
