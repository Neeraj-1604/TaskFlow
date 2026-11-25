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

let owner;
let member;
let admin;
let outsider;
let project;
let baseUrl;

beforeAll(async () => {
    await resetSchema();
});

beforeEach(async () => {
    await truncateAll();

    owner = await createUser({ name: 'Owner' });
    member = await createUser({ name: 'Member' });
    admin = await createUser({ name: 'Admin' });
    outsider = await createUser({ name: 'Outsider' });

    const created = await createProject(owner.accessToken, { name: 'Team Project' });
    project = created.body.data;
    baseUrl = `/api/v1/projects/${project.id}/members`;

    await addMember(project.id, owner.accessToken, { email: member.email, role: 'member' });
    await addMember(project.id, owner.accessToken, { email: admin.email, role: 'admin' });
});

afterAll(async () => {
    await closeDb();
});

describe('POST /members', () => {
    it('adds a registered user to the project', async () => {
        const res = await addMember(project.id, owner.accessToken, {
            email: outsider.email,
            role: 'member',
        });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            email: outsider.email,
            role: 'member',
            user_id: outsider.id,
        });
    });

    it('rejects a duplicate member with 409', async () => {
        const res = await addMember(project.id, owner.accessToken, {
            email: member.email,
        });

        expect(res.status).toBe(409);
    });

    it('returns 404 for an email that is not registered', async () => {
        const res = await addMember(project.id, owner.accessToken, {
            email: 'ghost@example.com',
        });

        expect(res.status).toBe(404);
    });

    it('rejects the owner role in the request body', async () => {
        const res = await addMember(project.id, owner.accessToken, {
            email: outsider.email,
            role: 'owner',
        });

        expect(res.status).toBe(400);
    });

    it('forbids a regular member from adding people', async () => {
        const res = await addMember(project.id, member.accessToken, {
            email: outsider.email,
        });

        expect(res.status).toBe(403);
    });

    it('forbids an admin from inviting another admin', async () => {
        const res = await addMember(project.id, admin.accessToken, {
            email: outsider.email,
            role: 'admin',
        });

        expect(res.status).toBe(403);
    });
});

describe('GET /members', () => {
    it('lists members with the owner first', async () => {
        const res = await request(app)
            .get(baseUrl)
            .set(auth(member.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(3);
        expect(res.body.data[0]).toMatchObject({ email: owner.email, role: 'owner' });
    });

    it('forbids non-members', async () => {
        const res = await request(app)
            .get(baseUrl)
            .set(auth(outsider.accessToken));

        expect(res.status).toBe(403);
    });
});

describe('PATCH /members/:userId', () => {
    it('lets the owner change a member role', async () => {
        const res = await request(app)
            .patch(`${baseUrl}/${member.id}`)
            .set(auth(owner.accessToken))
            .send({ role: 'admin' });

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('admin');
    });

    it('forbids an admin from changing roles', async () => {
        const res = await request(app)
            .patch(`${baseUrl}/${member.id}`)
            .set(auth(admin.accessToken))
            .send({ role: 'admin' });

        expect(res.status).toBe(403);
    });

    it('refuses to change the owner role', async () => {
        const res = await request(app)
            .patch(`${baseUrl}/${owner.id}`)
            .set(auth(owner.accessToken))
            .send({ role: 'member' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /members/:userId', () => {
    it('lets the owner remove a member', async () => {
        const res = await request(app)
            .delete(`${baseUrl}/${member.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);

        const list = await request(app).get(baseUrl).set(auth(owner.accessToken));
        expect(list.body.data).toHaveLength(2);
    });

    it('refuses to remove the project owner', async () => {
        const res = await request(app)
            .delete(`${baseUrl}/${owner.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(400);
    });

    it('lets a member leave the project', async () => {
        const res = await request(app)
            .delete(`${baseUrl}/${member.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(200);
    });

    it('lets an admin remove a regular member', async () => {
        const res = await request(app)
            .delete(`${baseUrl}/${member.id}`)
            .set(auth(admin.accessToken));

        expect(res.status).toBe(200);
    });

    it('forbids an admin from removing another admin', async () => {
        const secondAdmin = await createUser({ name: 'Second Admin' });
        await addMember(project.id, owner.accessToken, {
            email: secondAdmin.email,
            role: 'admin',
        });

        const res = await request(app)
            .delete(`${baseUrl}/${secondAdmin.id}`)
            .set(auth(admin.accessToken));

        expect(res.status).toBe(403);
    });
});
