const rateLimit = require('express-rate-limit');
const env = require('../config/env.js');

/**
 * Fixed-window rate limiting.
 *
 * `generalLimiter` protects the whole API from abuse.
 * `authLimiter` is stricter on register/login to slow down credential
 * stuffing and brute-force password guessing.
 *
 * Rate limiting is skipped during tests so the suite can make many requests
 * without tripping the counter.
 */

const skip = () => env.isTest;

const limitResponse = (message) => ({
    success: false,
    statusCode: 429,
    status: 'Fail',
    message,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: limitResponse('Too many requests from this IP. Please try again later.'),
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: limitResponse('Too many authentication attempts. Please try again in 15 minutes.'),
});

module.exports = {
    generalLimiter,
    authLimiter,
};
