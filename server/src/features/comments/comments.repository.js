const db = require('../../config/db.js');
const createComment = async ({ taskId, userId, content }) => {
    const query = `
        WITH inserted AS (
            INSERT INTO comments (task_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, task_id, user_id, content, created_at, updated_at
        )
        SELECT 
            i.id,
            i.task_id AS "taskId",
            i.content,
            i.created_at AS "createdAt",
            i.updated_at AS "updatedAt",
            u.id AS "authorId",
            u.name AS "authorName",
            u.email AS "authorEmail"
        FROM inserted i
        JOIN users u ON i.user_id = u.id;
    `;
    const { rows } = await db.query(query, [taskId, userId, content]);
    return rows[0];
};
const findCommentsByTaskId = async (taskId) => {
    const query = `
        SELECT 
            c.id,
            c.task_id AS "taskId",
            c.content,
            c.created_at AS "createdAt",
            c.updated_at AS "updatedAt",
            u.id AS "authorId",
            u.name AS "authorName",
            u.email AS "authorEmail"
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC;
    `;
    const { rows } = await db.query(query, [taskId]);
    return rows;
};
const findCommentById = async (commentId) => {
    const query = `
        SELECT 
            c.id,
            c.task_id AS "taskId",
            c.user_id AS "userId",
            c.content,
            c.created_at AS "createdAt",
            c.updated_at AS "updatedAt",
            u.id AS "authorId",
            u.name AS "authorName",
            u.email AS "authorEmail"
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1;
    `;
    const { rows } = await db.query(query, [commentId]);
    return rows[0] || null;
};
const updateComment = async (commentId, content) => {
    const query = `
        WITH updated AS (
            UPDATE comments
            SET content = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, task_id, user_id, content, created_at, updated_at
        )
        SELECT 
            u_com.id,
            u_com.task_id AS "taskId",
            u_com.content,
            u_com.created_at AS "createdAt",
            u_com.updated_at AS "updatedAt",
            usr.id AS "authorId",
            usr.name AS "authorName",
            usr.email AS "authorEmail"
        FROM updated u_com
        JOIN users usr ON u_com.user_id = usr.id;
    `;
    const { rows } = await db.query(query, [content, commentId]);
    return rows[0] || null;
};
const deleteComment = async (commentId) => {
    const query = `
        DELETE FROM comments
        WHERE id = $1
        RETURNING id;
    `;
    const { rows } = await db.query(query, [commentId]);
    return rows[0] || null;
};

module.exports = {
    createComment,
    findCommentsByTaskId,
    findCommentById,
    updateComment,
    deleteComment,
};
