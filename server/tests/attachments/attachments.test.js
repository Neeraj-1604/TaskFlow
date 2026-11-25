jest.mock('../../src/config/cloudinary.js', () => {
    const fs = require('fs');

    return {
        uploadOnCloudinary: jest.fn(async (filePath) => {
            // Mirror the real helper: remove the temporary upload file.
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                // Ignore cleanup failures in tests.
            }
            return {
                secure_url:
                    'https://res.cloudinary.com/demo/raw/upload/v1234/taskflow_attachments/note.txt',
            };
        }),
        deleteFromCloudinary: jest.fn(async () => ({ result: 'ok' })),
    };
});

const request = require('supertest');
const app = require('../../src/app.js');
const { deleteFromCloudinary } = require('../../src/config/cloudinary.js');
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
let outsider;
let project;
let task;
let baseUrl;

const uploadFile = (taskId, token, file = {}) => {
    const {
        filename = 'note.txt',
        content = Buffer.from('hello world'),
        contentType = 'text/plain',
    } = file;

    return request(app)
        .post(`/api/v1/projects/${project.id}/tasks/${taskId}/attachments`)
        .set(auth(token))
        .attach('file', content, { filename, contentType });
};

beforeAll(async () => {
    await resetSchema();
});

beforeEach(async () => {
    await truncateAll();

    owner = await createUser({ name: 'Owner' });
    member = await createUser({ name: 'Member' });
    outsider = await createUser({ name: 'Outsider' });

    const created = await createProject(owner.accessToken, { name: 'Files' });
    project = created.body.data;
    await addMember(project.id, owner.accessToken, { email: member.email });

    const taskRes = await createTask(project.id, owner.accessToken, { title: 'Has files' });
    task = taskRes.body.data;
    baseUrl = `/api/v1/projects/${project.id}/tasks/${task.id}/attachments`;
});

afterAll(async () => {
    await closeDb();
});

describe('POST /attachments', () => {
    it('uploads a file and stores its metadata', async () => {
        const res = await uploadFile(task.id, owner.accessToken);

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            taskId: task.id,
            fileName: 'note.txt',
            mimeType: 'text/plain',
            uploaderId: owner.id,
        });
        expect(res.body.data.fileUrl).toMatch(/^https:\/\//);
    });

    it('rejects a request without a file', async () => {
        const res = await request(app)
            .post(baseUrl)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/provide a file/i);
    });

    it('rejects a disallowed mime type', async () => {
        const res = await uploadFile(task.id, owner.accessToken, {
            filename: 'malware.exe',
            content: Buffer.from('MZ'),
            contentType: 'application/x-msdownload',
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid file type/i);
    });

    it('forbids non-members from uploading', async () => {
        const res = await uploadFile(task.id, outsider.accessToken);

        expect(res.status).toBe(403);
    });
});

describe('GET /attachments', () => {
    it('lists attachments for a task', async () => {
        await uploadFile(task.id, owner.accessToken);

        const res = await request(app).get(baseUrl).set(auth(member.accessToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].fileName).toBe('note.txt');
    });
});

describe('DELETE /attachments/:attachmentId', () => {
    it('lets the uploader delete the attachment and its cloud asset', async () => {
        const uploaded = await uploadFile(task.id, owner.accessToken);

        const res = await request(app)
            .delete(`${baseUrl}/${uploaded.body.data.id}`)
            .set(auth(owner.accessToken));

        expect(res.status).toBe(200);
        expect(deleteFromCloudinary).toHaveBeenCalled();
    });

    it('forbids another regular member from deleting it', async () => {
        const uploaded = await uploadFile(task.id, owner.accessToken);

        const res = await request(app)
            .delete(`${baseUrl}/${uploaded.body.data.id}`)
            .set(auth(member.accessToken));

        expect(res.status).toBe(403);
    });

    it('returns 404 when the attachment belongs to another task', async () => {
        const uploaded = await uploadFile(task.id, owner.accessToken);
        const secondTask = await createTask(project.id, owner.accessToken, { title: 'Task two' });

        const res = await request(app)
            .delete(
                `/api/v1/projects/${project.id}/tasks/${secondTask.body.data.id}/attachments/${uploaded.body.data.id}`
            )
            .set(auth(owner.accessToken));

        expect(res.status).toBe(404);
    });
});
