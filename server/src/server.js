const app = require('./app.js');
const env = require('./config/env.js');
const logger = require('./config/logger.js');
const db = require('./config/db.js');

const server = app.listen(env.port, () => {
    logger.info(`TaskFlow server is running on http://localhost:${env.port} (${env.nodeEnv})`);
});

/**
 * Graceful shutdown: stop accepting new connections, then close the
 * PostgreSQL pool so in-flight queries can finish. The forced-exit timer
 * prevents a hung connection from keeping the process alive forever.
 */
const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        try {
            await db.pool.end();
            logger.info('HTTP server and database pool closed.');
            process.exit(0);
        } catch (err) {
            logger.error('Error while closing database pool', err);
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error('Could not close connections in time, forcing exit.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
});
