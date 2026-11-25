const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Centralized environment configuration.
 *
 * Every module reads config from here instead of touching `process.env`
 * directly. Required values are validated once at startup so the process
 * fails fast with a readable message instead of failing later with
 * "undefined is not a function" style errors.
 */

const required = (name) => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return undefined;
    }
    return value;
};

const optional = (name, fallback) => {
    const value = process.env[name];
    return value === undefined || value === '' ? fallback : value;
};

const nodeEnv = optional('NODE_ENV', 'development');

const env = {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(optional('PORT', 5000)),
    corsOrigin: optional('CORS_ORIGIN', '*'),
    logLevel: optional('LOG_LEVEL', 'info'),
    db: {
        host: required('DB_HOST'),
        port: Number(optional('DB_PORT', 5432)),
        user: required('DB_USER'),
        password: required('DB_PASSWORD'),
        name: required('DB_NAME'),
        poolMax: Number(optional('DB_POOL_MAX', 20)),
    },
    jwt: {
        accessSecret: required('ACCESS_TOKEN_SECRET'),
        accessExpiresIn: optional('ACCESS_EXPIRES_IN', '15m'),
        refreshSecret: required('REFRESH_TOKEN_SECRET'),
        refreshExpiresIn: optional('REFRESH_EXPIRES_IN', '7d'),
    },
    cloudinary: {
        cloudName: optional('CLOUDINARY_CLOUD_NAME'),
        apiKey: optional('CLOUDINARY_API_KEY'),
        apiSecret: optional('CLOUDINARY_API_SECRET'),
    },
};

const missing = [];
if (!env.db.host) missing.push('DB_HOST');
if (!env.db.user) missing.push('DB_USER');
if (!env.db.password) missing.push('DB_PASSWORD');
if (!env.db.name) missing.push('DB_NAME');
if (!env.jwt.accessSecret) missing.push('ACCESS_TOKEN_SECRET');
if (!env.jwt.refreshSecret) missing.push('REFRESH_TOKEN_SECRET');

if (missing.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill in the values.'
    );
}

if (Number.isNaN(env.port)) {
    throw new Error('PORT must be a number');
}

module.exports = env;
