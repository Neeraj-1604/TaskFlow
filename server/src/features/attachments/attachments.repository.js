const db = require('../../config/db.js');

/**
 * Insert attachment metadata into the database and return with uploader details.
 */
const createAttachment = async ({
    taskId,
    uploaderId,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
}) => {
    const query = `
        WITH inserted AS (
            INSERT INTO attachments (task_id, uploader_id, file_name, file_url, file_size, mime_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, task_id, uploader_id, file_name, file_url, file_size, mime_type, created_at
        )
        SELECT 
            i.id,
            i.task_id AS "taskId",
            i.file_name AS "fileName",
            i.file_url AS "fileUrl",
            i.file_size AS "fileSize",
            i.mime_type AS "mimeType",
            i.created_at AS "createdAt",
            u.id AS "uploaderId",
            u.name AS "uploaderName",
            u.email AS "uploaderEmail"
        FROM inserted i
        JOIN users u ON i.uploader_id = u.id;
    `;
    const { rows } = await db.query(query, [
        taskId,
        uploaderId,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
    ]);
    return rows[0];
};

/**
 * Fetch all attachments for a specific task with uploader details in a single query (No N+1).
 */
const findAttachmentsByTaskId = async (taskId) => {
    const query = `
        SELECT 
            a.id,
            a.task_id AS "taskId",
            a.file_name AS "fileName",
            a.file_url AS "fileUrl",
            a.file_size AS "fileSize",
            a.mime_type AS "mimeType",
            a.created_at AS "createdAt",
            u.id AS "uploaderId",
            u.name AS "uploaderName",
            u.email AS "uploaderEmail"
        FROM attachments a
        JOIN users u ON a.uploader_id = u.id
        WHERE a.task_id = $1
        ORDER BY a.created_at DESC;
    `;
    const { rows } = await db.query(query, [taskId]);
    return rows;
};

/**
 * Fetch a single attachment by ID.
 */
const findAttachmentById = async (attachmentId) => {
    const query = `
        SELECT 
            a.id,
            a.task_id AS "taskId",
            a.uploader_id AS "uploaderId",
            a.file_name AS "fileName",
            a.file_url AS "fileUrl",
            a.file_size AS "fileSize",
            a.mime_type AS "mimeType",
            a.created_at AS "createdAt",
            u.name AS "uploaderName",
            u.email AS "uploaderEmail"
        FROM attachments a
        JOIN users u ON a.uploader_id = u.id
        WHERE a.id = $1;
    `;
    const { rows } = await db.query(query, [attachmentId]);
    return rows[0] || null;
};

/**
 * Delete an attachment by ID.
 */
const deleteAttachment = async (attachmentId) => {
    const query = `
        DELETE FROM attachments
        WHERE id = $1
        RETURNING id, file_url AS "fileUrl";
    `;
    const { rows } = await db.query(query, [attachmentId]);
    return rows[0] || null;
};

module.exports = {
    createAttachment,
    findAttachmentsByTaskId,
    findAttachmentById,
    deleteAttachment,
};
