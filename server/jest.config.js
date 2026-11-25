/**
 * Jest configuration for the TaskFlow API.
 *
 * The suite is integration-style: Supertest drives the real Express app and
 * the repositories talk to a real PostgreSQL database (a separate `_test`
 * database). `globalSetup` creates that database if it does not exist, and
 * each test file resets the schema before running.
 */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    globalSetup: '<rootDir>/tests/globalSetup.js',
    setupFiles: ['<rootDir>/tests/setup.js'],
    clearMocks: true,
    verbose: true,
    testTimeout: 30000,
    // One worker keeps schema resets from racing each other.
    maxWorkers: 1,
};
