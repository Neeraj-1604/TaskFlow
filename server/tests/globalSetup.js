// Reuse the same environment defaults as the test files.
require('./setup.js');

const { Client } = require('pg');

/**
 * Jest globalSetup runs once before any test file. It connects to the default
 * `postgres` maintenance database and creates the test database if needed.
 */
module.exports = async () => {
    const targetDatabase = process.env.DB_NAME;

    const client = new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres',
    });

    try {
        await client.connect();

        const existing = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [targetDatabase]
        );

        if (existing.rowCount === 0) {
            // Identifiers cannot be parameterized; the name comes from our own
            // env config, and quoting keeps it safe.
            await client.query(`CREATE DATABASE "${targetDatabase}"`);
            console.log(`Created test database "${targetDatabase}"`);
        }
    } finally {
        await client.end();
    }
};
