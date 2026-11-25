const request = require('supertest');
const app = require('../../src/app.js');
const {
    resetSchema,
    truncateAll,
    closeDb,
    createUser,
    auth,
    createProject,
    addMember,
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

describe('POST /api/v1/projects', () => {
    it('creates a project and returns it', async () => {
        const owner = await createUser({ name: 'Owner' });

        const res = await createProject(owner.accessToken, {
            name: 'Website Redesign',
            description: 'Q1 marketing site',
        });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            name: 'Website Redesign',
            description: 'Q1 marketing site',
        });
        expect(res.body.data.id).toEqual(expect.any(String));
    });

    it('rejects an invalid body', async () => {
        const owner = await createUser();

        const res = await request(app)
            .post('/api/v1/projects')
            .set(auth(owner.accessToken))
            .send({ name: 'x' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: 'name' })])
        );
    });

    it('rejects unauthenticated requests', async () => {
        const res = await request(app).post('/api/v1/projects').send({ name: 'No Auth' });
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/projects', () => {
    it('lists the projects the user belongs to with their role', async () => {
        const owner = await createUser();
        await createProject(owner.accessToken, { name: 'Alpha' });

        const res = await request(app)
            .get('/api/v1/projects')
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({ name: 'Alpha', role: 'owner' });
    });

    it('does not show projects the user is not a member of', async () => {
        const owner = await createUser();
        const outsider = await createUser();
        await createProject(owner.accessToken, { name: 'Private' });

        const res = await request(app)
            .get('/api/v1/projects')
            .set(auth(outsider.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });
});

describe('GET /api/v1/projects/:id', () => {
    it('returns project details with the current user role', async () => {
        const owner = await createUser();
        const created = await createProject(owner.accessToken, { name: 'Details' });

        const res = await request(app)
            .get(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.currentUserRole).toBe('owner');
    });

    it('forbids non-members with 403', async () => {
        const owner = await createUser();
        const outsider = await createUser();
        const created = await createProject(owner.accessToken);

        const res = await request(app)
            .get(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(outsider.accessToken));

        expect(res.status).toBe(403);
    });

    it('rejects a malformed project id with 400', async () => {
        const owner = await createUser();

        const res = await request(app)
            .get('/api/v1/projects/not-a-uuid')
            .set(auth(owner.accessToken));

        expect(res.status).toBe(400);
    });
});

describe('PATCH /api/v1/projects/:id', () => {
    it('lets the owner update the project', async () => {
        const owner = await createUser();
        const created = await createProject(owner.accessToken, { name: 'Old Name' });

        const res = await request(app)
            .patch(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(owner.accessToken))
            .send({ name: 'New Name' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('New Name');
    });

    it('lets an admin update the project', async () => {
        const owner = await createUser();
        const admin = await createUser();
        const created = await createProject(owner.accessToken);
        await addMember(created.body.data.id, owner.accessToken, {
            email: admin.email,
            role: 'admin',
        });

        const res = await request(app)
            .patch(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(admin.accessToken))
            .send({ description: 'Updated by admin' });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe('Updated by admin');
    });

    it('forbids a regular member from updating', async () => {
        const owner = await createUser();
        const member = await createUser();
        const created = await createProject(owner.accessToken);
        await addMember(created.body.data.id, owner.accessToken, { email: member.email });

        const res = await request(app)
            .patch(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(member.accessToken))
            .send({ name: 'Hijacked' });

        expect(res.status).toBe(403);
    });

    it('rejects an empty update body', async () => {
        const owner = await createUser();
        const created = await createProject(owner.accessToken);

        const res = await request(app)
            .patch(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(owner.accessToken))
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/projects/:id', () => {
    it('lets only the owner delete the project', async () => {
        const owner = await createUser();
        const admin = await createUser();
        const created = await createProject(owner.accessToken);
        await addMember(created.body.data.id, owner.accessToken, {
            email: admin.email,
            role: 'admin',
        });

        const forbidden = await request(app)
            .delete(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(admin.accessToken));
        expect(forbidden.status).toBe(403);

        const deleted = await request(app)
            .delete(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(owner.accessToken));
        expect(deleted.status).toBe(200);

        const after = await request(app)
            .get(`/api/v1/projects/${created.body.data.id}`)
            .set(auth(owner.accessToken));
        expect(after.status).toBe(404);
    });
});
