const db = require('../../config/db');


const createTask = async ({
    projectId, title, description = null, status = 'todo', priority = 'medium', dueDate = null, creatorId, assigneeId = null
}) => {
    const qury = `INSERT INTO TASKS(project_id,title,description,status,priority,due_date,creator_id,assignee_id)VALUES($1,$2,$3,$4,$5,$6,$7,$8) 
            RETURNING
            id,
            project_id AS "projectId",
            title,
            description,
            status,
            priority,
            due_date AS "dueDate",
            creator_id AS "creatorId",
            assignee_id AS "assigneeId",
            created_at AS "createdAt",
            updated_at AS "updatedAt";`;
    const result = await db.query(qury, [projectId, title, description, status, priority, dueDate, creatorId, assigneeId]);
    return result.rows[0];
}
const findTaskById = async (taskId) => {
    const query = `SELECT 
            t.id,
            t.project_id AS "projectId",
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_date AS "dueDate",
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt",
            -- Creator details
            t.creator_id AS "creatorId",
            u_creator.name AS "creatorName",
            u_creator.email AS "creatorEmail",
            -- Assignee details
            t.assignee_id AS "assigneeId",
            u_assignee.name AS "assigneeName",
            u_assignee.email AS "assigneeEmail"
        FROM tasks t
        JOIN users u_creator ON t.creator_id = u_creator.id
        LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
        WHERE t.id = $1;`;
    const result = await db.query(query, [taskId]);
    return result.rows[0];
}
const findTasksByProjectId = async (projectId, options = {}) => {
    const {
        status,
        priority,
        assigneeId,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        limit = 10,
        offset = 0,
    } = options;

    const allowedSortFields = {
        created_at: 't.created_at',
        due_date: 't.due_date',
        priority: 't.priority',
        title: 't.title',
        status: 't.status',
    };

    const sortColumn = allowedSortFields[sortBy] || 't.created_at';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const conditions = ['t.project_id = $1'];
    const values = [projectId];
    let paramIndex = 2;

    if (status) {
        conditions.push(`t.status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
    }

    if (priority) {
        conditions.push(`t.priority = $${paramIndex}`);
        values.push(priority);
        paramIndex++;
    }

    if (assigneeId) {
        conditions.push(`t.assignee_id = $${paramIndex}`);
        values.push(assigneeId);
        paramIndex++;
    }

    if (search) {
        conditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
        SELECT COUNT(t.id) AS "total"
        FROM tasks t
        WHERE ${whereClause};
    `;
    const countResult = await db.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].total, 10);

    const dataValues = [...values, limit, offset];
    const dataQuery = `
        SELECT 
            t.id,
            t.project_id AS "projectId",
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_date AS "dueDate",
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt",
            t.creator_id AS "creatorId",
            u_creator.name AS "creatorName",
            t.assignee_id AS "assigneeId",
            u_assignee.name AS "assigneeName"
        FROM tasks t
        JOIN users u_creator ON t.creator_id = u_creator.id
        LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
        WHERE ${whereClause}
        ORDER BY ${sortColumn} ${direction}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    const { rows } = await db.query(dataQuery, dataValues);

    return { tasks: rows, totalItems };
};
const updateTask = async (taskId, updateData) => {
    const fieldMapping = {
        title: 'title',
        description: 'description',
        status: 'status',
        priority: 'priority',
        dueDate: 'due_date',
        assigneeId: 'assignee_id',
    };
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, column] of Object.entries(fieldMapping)) {
        if (updateData[key] !== undefined) {
            setClauses.push(`${column} = $${paramIndex}`);
            values.push(updateData[key]);
            paramIndex++;
        }
    }
    setClauses.push(`updated_at = NOW()`);
    values.push(taskId);
    const query = `
        UPDATE tasks
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
            id,
            project_id AS "projectId",
            title,
            description,
            status,
            priority,
            due_date AS "dueDate",
            creator_id AS "creatorId",
            assignee_id AS "assigneeId",
            created_at AS "createdAt",
            updated_at AS "updatedAt";
    `;
    const { rows } = await db.query(query, values);
    return rows[0] || null;
};
const deleteTask = async (taskId) => {
    const query = `
        DELETE FROM tasks
        WHERE id = $1
        RETURNING id;
    `;
    const { rows } = await db.query(query, [taskId]);
    return rows[0] || null;
};
module.exports = {
    createTask,
    findTaskById,
    findTasksByProjectId,
    updateTask,
    deleteTask
}