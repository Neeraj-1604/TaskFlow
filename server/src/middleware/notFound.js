const AppError = require('../errors/AppError.js');

/**
 * Catch-all for unmatched routes. Passes a 404 to the centralized error
 * handler so every error response has the same shape.
 */
const notFound = (req, res, next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
};

module.exports = notFound;
