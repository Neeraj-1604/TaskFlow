const path = require('path');

// Load real credentials from .env when present, then override the pieces that
// must differ for tests. dotenv never overwrites variables that are already
// set, so CI can inject its own values.
require('dotenv').config({ path: path.join(__dirname, '../.env') });

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh-token-secret';
process.env.ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m';
process.env.REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Never run tests against the development database.
process.env.DB_NAME = process.env.TEST_DB_NAME || `${process.env.DB_NAME || 'taskflow'}_test`;

process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-secret';
