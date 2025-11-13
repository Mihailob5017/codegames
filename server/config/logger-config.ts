import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output in development
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
});

// Log directory path
const LOG_DIR = path.join(__dirname, '../logs');

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'codegames-backend' },
    transports: [
        // Error logs - only errors
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined logs - all levels
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleFormat
            ),
        })
    );
}

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    })
);

logger.rejections.handle(
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'rejections.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    })
);

// Helper method to create child loggers with additional context
export const createChildLogger = (context: Record<string, any>) => {
    return logger.child(context);
};

export default logger;
