const fs = require('fs');
const path = require('path');
const request = require('supertest');

const app = require('../src/app.js');
const db = require('../src/config/db.js');

const schemaSql = fs.readFileSync(
    path.join(__dirname, '../database/migrations/init_schema.sql'),
    'utf8'
);

const PASSWORD = 'Password123!';

/**
 * Drop and recreate the public schema, then apply the real migration file.
 * Called once per test file so every file starts from a known state.
 */
const resetSchema = async () => {
    await db.query('DROP SCHEMA IF EXISTS public CASCADE');
    await db.query('CREATE SCHEMA public');
    await db.query(schemaSql);
};

/** Remove all rows between tests without paying for a full schema reset. */
const truncateAll = async () => {
    await db.query(
        'TRUNCATE TABLE users, projects, project_members, tasks, comments, attachments RESTART IDENTITY CASCADE'
    );
};

const closeDb = async () => {
    await db.pool.end();
};

let counter = 0;
const uniqueEmail = (prefix = 'user') => {
    counter += 1;
    return `${prefix}.${Date.now()}.${counter}@example.com`;
};

const registerUser = async (overrides = {}) => {
    const body = {
        name: 'Test User',
        email: uniqueEmail(),
        password: PASSWORD,
        ...overrides,
    };
    const res = await request(app).post('/api/v1/auth/register').send(body);
    return { res, body, user: res.body.data };
};

const loginUser = async ({ email, password }) => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return {
        res,
        accessToken: res.body.data && res.body.data.accessToken,
        setCookie: res.headers['set-cookie'],
    };
};

/** Register + login, returning everything a test needs to act as that user. */
const createUser = async (overrides = {}) => {
    const { res, body, user } = await registerUser(overrides);
    if (res.status !== 201) {
        throw new Error(`Failed to register test user: ${JSON.stringify(res.body)}`);
    }
    const login = await loginUser({ email: body.email, password: body.password });
    if (!login.accessToken) {
        throw new Error(`Failed to log in test user: ${JSON.stringify(login.res.body)}`);
    }
    return {
        id: user.id,
        name: user.name,
        email: body.email,
        password: body.password,
        accessToken: login.accessToken,
        user,
    };
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const createProject = (token, overrides = {}) => {
    return request(app)
        .post('/api/v1/projects')
        .set(auth(token))
        .send({ name: 'Test Project', ...overrides });
};

const addMember = (projectId, token, { email, role = 'member' }) => {
    return request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set(auth(token))
        .send({ email, role });
};

const createTask = (projectId, token, overrides = {}) => {
    return request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set(auth(token))
        .send({ title: 'Test Task', ...overrides });
};

module.exports = {
    app,
    db,
    request,
    PASSWORD,
    resetSchema,
    truncateAll,
    closeDb,
    uniqueEmail,
    registerUser,
    loginUser,
    createUser,
    auth,
    createProject,
    addMember,
    createTask,
};
