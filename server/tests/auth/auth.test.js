const request = require('supertest');
const app = require('../../src/app.js');
const {
    resetSchema,
    truncateAll,
    closeDb,
    registerUser,
    loginUser,
    PASSWORD,
} = require('../helpers.js');

beforeAll(async () => {
    await resetSchema();
});

beforeEach(async () => {
    await truncateAll();
});

afterAll(async () => {
    await closeDb();
});

describe('POST /api/v1/auth/register', () => {
    it('registers a user and never returns the password hash', async () => {
        const { res, body } = await registerUser({
            name: 'Neeraj',
            email: 'Neeraj@Example.com',
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            name: 'Neeraj',
            email: 'neeraj@example.com',
        });
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.password_hash).toBeUndefined();
        expect(body.password).toBe(PASSWORD);
    });

    it('rejects a duplicate email with 409', async () => {
        const { body } = await registerUser({ email: 'duplicate@example.com' });

        const second = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Someone Else', email: body.email, password: PASSWORD });

        expect(second.status).toBe(409);
        expect(second.body.message).toMatch(/already exists/i);
    });

    it('rejects a weak password with field-level errors', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ name: 'Weak Pass', email: 'weak@example.com', password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ field: 'password' }),
            ])
        );
    });

    it('rejects unknown fields because the schema is strict', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Extra Field',
                email: 'extra@example.com',
                password: PASSWORD,
                isAdmin: true,
            });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/v1/auth/login', () => {
    it('returns an access token and sets the refresh cookie', async () => {
        const { body } = await registerUser({ email: 'login@example.com' });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: body.email, password: body.password });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toEqual(expect.any(String));
        expect(res.body.data.user.email).toBe(body.email);
        expect(res.headers['set-cookie'].join(';')).toMatch(/refreshToken=/);
        expect(res.headers['set-cookie'].join(';')).toMatch(/HttpOnly/i);
    });

    it('rejects a wrong password with 401', async () => {
        const { body } = await registerUser({ email: 'wrongpass@example.com' });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: body.email, password: 'WrongPassword123!' });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('rejects an unknown email with 401', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'nobody@example.com', password: PASSWORD });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/auth/me', () => {
    it('returns the current user for a valid access token', async () => {
        const { body } = await registerUser({ name: 'Me User', email: 'me@example.com' });
        const { accessToken } = await loginUser(body);

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('me@example.com');
        expect(res.body.data.password_hash).toBeUndefined();
    });

    it('rejects a request without a token', async () => {
        const res = await request(app).get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });

    it('rejects a refresh token used as a bearer token', async () => {
        const agent = request.agent(app);
        const { body } = await registerUser({ email: 'refreshtoken@example.com' });

        const login = await agent.post('/api/v1/auth/login').send({
            email: body.email,
            password: body.password,
        });

        const refreshToken = login.headers['set-cookie'][0].split(';')[0].split('=')[1];
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${refreshToken}`);

        expect(res.status).toBe(401);
    });
});

describe('refresh and logout', () => {
    it('issues a new access token from the refresh cookie', async () => {
        const agent = request.agent(app);
        const { body } = await registerUser({ email: 'refresh@example.com' });

        await agent.post('/api/v1/auth/login').send({
            email: body.email,
            password: body.password,
        });

        const refreshed = await agent.post('/api/v1/auth/refresh');
        expect(refreshed.status).toBe(200);
        expect(refreshed.body.data.accessToken).toEqual(expect.any(String));

        const me = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${refreshed.body.data.accessToken}`);
        expect(me.status).toBe(200);
    });

    it('rejects refresh when no cookie is present', async () => {
        const res = await request(app).post('/api/v1/auth/refresh');
        expect(res.status).toBe(401);
    });

    it('clears the refresh cookie on logout', async () => {
        const agent = request.agent(app);
        const { body } = await registerUser({ email: 'logout@example.com' });

        await agent.post('/api/v1/auth/login').send({
            email: body.email,
            password: body.password,
        });

        const logout = await agent.post('/api/v1/auth/logout');
        expect(logout.status).toBe(200);

        const refreshed = await agent.post('/api/v1/auth/refresh');
        expect(refreshed.status).toBe(401);
    });
});
