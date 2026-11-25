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
let other;
let project;
let task;
let baseUrl;

beforeAll(async () => {
    await resetSchema();
});

beforeEach(async () => {
    await truncateAll();

    owner = await createUser({ name: 'Owner' });
    member = await createUser({ name: 'Member' });
    other = await createUser({ name: 'Other' });

    const created = await createProject(owner.accessToken, { name: 'Comment Project' });
    project = created.body.data;

    await addMember(project.id, owner.accessToken, { email: member.email });
    await addMember(project.id, owner.accessToken, { email: other.email });

    const taskRes = await createTask(project.id, owner.accessToken, { title: 'Discuss me' });
    task = taskRes.body.data;

    baseUrl = `/api/v1/projects/${project.id}/tasks/${task.id}/comments`;
});

afterAll(async () => {
    await closeDb();
});

describe('POST /comments', () => {
    it('creates a comment and returns author metadata', async () => {
        const res = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'Looks good to me' });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            taskId: task.id,
            content: 'Looks good to me',
            authorId: member.id,
            authorName: 'Member',
            authorEmail: member.email,
        });
    });

    it('rejects empty content', async () => {
        const res = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: '   ' });

        expect(res.status).toBe(400);
    });

    it('returns 404 when the task is not in the project', async () => {
        const otherProject = await createProject(owner.accessToken, { name: 'Other' });

        const res = await request(app)
            .post(`/api/v1/projects/${otherProject.body.data.id}/tasks/${task.id}/comments`)
            .set(auth(owner.accessToken))
            .send({ content: 'Wrong project' });

        expect(res.status).toBe(404);
    });

    it('forbids non-members', async () => {
        const outsider = await createUser();

        const res = await request(app)
            .post(baseUrl)
            .set(auth(outsider.accessToken))
            .send({ content: 'Not allowed' });

        expect(res.status).toBe(403);
    });
});

describe('GET /comments', () => {
    it('lists comments oldest first', async () => {
        await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'First' });
        await request(app)
            .post(baseUrl)
            .set(auth(owner.accessToken))
            .send({ content: 'Second' });

        const res = await request(app)
            .get(baseUrl)
            .set(auth(other.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data.map((comment) => comment.content)).toEqual(['First', 'Second']);
    });
});

describe('PATCH /comments/:commentId', () => {
    it('lets the author edit their comment', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'Original' });

        const res = await request(app)
            .patch(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken))
            .send({ content: 'Edited' });

        expect(res.status).toBe(200);
        expect(res.body.data.content).toBe('Edited');
    });

    it('forbids editing someone else\'s comment', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(owner.accessToken))
            .send({ content: 'Owner comment' });

        const res = await request(app)
            .patch(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken))
            .send({ content: 'Hijacked' });

        expect(res.status).toBe(403);
    });

    it('returns 404 when the comment belongs to another task', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'On task one' });

        const secondTask = await createTask(project.id, owner.accessToken, { title: 'Task two' });
        const secondBase = `/api/v1/projects/${project.id}/tasks/${secondTask.body.data.id}/comments`;

        const res = await request(app)
            .patch(`${secondBase}/${created.body.data.id}`)
            .set(auth(member.accessToken))
            .send({ content: 'Wrong task' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /comments/:commentId', () => {
    it('lets the author delete their own comment', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'Delete me' });

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(200);
    });

    it('lets an owner moderate another user\'s comment', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(member.accessToken))
            .send({ content: 'Moderate me' });

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
    });

    it('forbids a regular member from deleting someone else\'s comment', async () => {
        const created = await request(app)
            .post(baseUrl)
            .set(auth(owner.accessToken))
            .send({ content: 'Owner comment' });

        const res = await request(app)
            .delete(`${baseUrl}/${created.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(403);
    });
});
