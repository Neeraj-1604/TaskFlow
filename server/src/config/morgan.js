const morgan = require('morgan');
const logger = require('./logger');
const env = require('./env');

/**
 * Morgan writes HTTP access logs through Winston so request logs and
 * application logs end up in the same stream/format.
 *
 * `dev` is short and colorized; `combined` includes the standard Apache
 * fields (IP, method, URL, status, response time) used in production.
 */

const stream = {
    write: (message) => logger.info(message.trim()),
};

const skip = () => env.isTest;

const morganMiddleware = morgan(
    env.isProduction ? 'combined' : 'dev',
    { stream, skip }
);

module.exports = morganMiddleware;
