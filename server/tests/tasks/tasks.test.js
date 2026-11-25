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
    createTask,
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

    const created = await createProject(owner.accessToken, { name: 'Alpha Project' });
    project = created.body.data;
    baseUrl = `/api/v1/projects/${project.id}/tasks`;

    await addMember(project.id, owner.accessToken, {
        email: member.email,
        role: 'member',
    });
    await addMember(project.id, owner.accessToken, {
        email: admin.email,
        role: 'admin',
    });
});

afterAll(async () => {
    await closeDb();
});

describe('POST /tasks', () => {
    it('creates a task with default status and priority', async () => {
        const res = await createTask(project.id, owner.accessToken, {
            title: 'Write integration tests',
            description: 'Cover the API',
        });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            projectId: project.id,
            title: 'Write integration tests',
            status: 'todo',
            priority: 'medium',
            creatorId: owner.id,
        });
    });

    it('assigns a project member', async () => {
        const res = await createTask(project.id, owner.accessToken, {
            assigneeId: member.id,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.assigneeId).toBe(member.id);
    });

    it('rejects an assignee who is not a project member', async () => {
        const res = await createTask(project.id, owner.accessToken, {
            assigneeId: outsider.id,
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/assignee must be a member/i);
    });

    it('rejects an invalid status', async () => {
        const res = await createTask(project.id, owner.accessToken, { status: 'blocked' });
        expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests', async () => {
        const res = await request(app).post(baseUrl).send({ title: 'No auth' });
        expect(res.status).toBe(401);
    });
});

describe('GET /tasks', () => {
    it('paginates results and reports pagination metadata', async () => {
        await createTask(project.id, owner.accessToken, { title: 'One' });
        await createTask(project.id, owner.accessToken, { title: 'Two' });
        await createTask(project.id, owner.accessToken, { title: 'Three' });

        const res = await request(app)
            .get(`${baseUrl}?page=1&limit=2`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.tasks).toHaveLength(2);
        expect(res.body.data.pagination).toMatchObject({
            page: 1,
            limit: 2,
            totalItems: 3,
            totalPages: 2,
            hasNextPage: true,
            hasPrevPage: false,
        });
    });

    it('filters by status', async () => {
        await createTask(project.id, owner.accessToken, { title: 'Todo task' });
        await createTask(project.id, owner.accessToken, {
            title: 'Done task',
            status: 'done',
        });

        const res = await request(app)
            .get(`${baseUrl}?status=done`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.tasks).toHaveLength(1);
        expect(res.body.data.tasks[0].title).toBe('Done task');
    });

    it('searches title and description', async () => {
        await createTask(project.id, owner.accessToken, {
            title: 'Fix login bug',
            description: 'Auth issue on mobile',
        });
        await createTask(project.id, owner.accessToken, { title: 'Write docs' });

        const res = await request(app)
            .get(`${baseUrl}?search=login`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.tasks).toHaveLength(1);
        expect(res.body.data.tasks[0].title).toBe('Fix login bug');
    });

    it('sorts by an allowed column', async () => {
        await createTask(project.id, owner.accessToken, { title: 'Charlie' });
        await createTask(project.id, owner.accessToken, { title: 'Alpha' });
        await createTask(project.id, owner.accessToken, { title: 'Bravo' });

        const res = await request(app)
            .get(`${baseUrl}?sortBy=title&sortOrder=asc`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.tasks.map((task) => task.title)).toEqual([
            'Alpha',
            'Bravo',
            'Charlie',
        ]);
    });

    it('rejects a limit above 100', async () => {
        const res = await request(app)
            .get(`${baseUrl}?limit=101`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(400);
    });

    it('forbids non-members with 403', async () => {
        const res = await request(app)
            .get(baseUrl)
            .set(auth(outsider.accessToken));

        expect(res.status).toBe(403);
    });

    it('rejects a malformed project id before hitting the database', async () => {
        const res = await request(app)
            .get('/api/v1/projects/not-a-uuid/tasks')
            .set(auth(owner.accessToken));

        expect(res.status).toBe(400);
    });
});

describe('GET /tasks/:taskId', () => {
    it('returns a single task', async () => {
        const created = await createTask(project.id, owner.accessToken, {
            title: 'Single task',
        });

        const res = await request(app)
            .get(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Single task');
    });

    it('returns 404 when the task belongs to another project', async () => {
        const task = await createTask(project.id, owner.accessToken);
        const otherProject = await createProject(owner.accessToken, { name: 'Other' });

        const res = await request(app)
            .get(`/api/v1/projects/${otherProject.body.data.id}/tasks/${task.body.data.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(404);
    });
});

describe('PATCH /tasks/:taskId', () => {
    it('updates task fields', async () => {
        const created = await createTask(project.id, owner.accessToken);

        const res = await request(app)
            .patch(`${baseUrl}/${created.body.data.id}`)
            .set(auth(owner.accessToken))
            .send({ status: 'done', priority: 'high' });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ status: 'done', priority: 'high' });
    });

    it('rejects assigning a non-member', async () => {
        const created = await createTask(project.id, owner.accessToken);

        const res = await request(app)
            .patch(`${baseUrl}/${created.body.data.id}`)
            .set(auth(owner.accessToken))
            .send({ assigneeId: outsider.id });

        expect(res.status).toBe(400);
    });

    it('rejects an empty update body', async () => {
        const created = await createTask(project.id, owner.accessToken);

        const res = await request(app)
            .patch(`${baseUrl}/${created.body.data.id}`)
            .set(auth(owner.accessToken))
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('DELETE /tasks/:taskId', () => {
    it('lets the creator delete their own task', async () => {
        const created = await createTask(project.id, member.accessToken);

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(200);
    });

    it('forbids a regular member from deleting someone else\'s task', async () => {
        const created = await createTask(project.id, owner.accessToken);

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(403);
    });

    it('lets an admin delete someone else\'s task', async () => {
        const created = await createTask(project.id, member.accessToken);

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(admin.accessToken));

        expect(res.status).toBe(200);
    });
});
