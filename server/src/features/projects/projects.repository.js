const db = require('../../config/db.js');
const createProject = async ({ name, description, userId }) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const insertProjectQuery = `INSERT INTO projects (name, description, owner_id) VALUES($1, $2, $3)
        RETURNING id, name, description,  created_at, updated_at`;
        const projectResult = await client.query(insertProjectQuery, [name, description, userId]);
        const project = projectResult.rows[0];

        const insertMemberQuery = `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`;
        await client.query(insertMemberQuery, [project.id, userId]);
        await client.query('COMMIT');
        return project;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
const findProjectByUserId = async (userId) => {
    const query = `SELECT p.id,p.name,p.description,p.owner_id,pm.role,p.created_at,p.updated_at
    FROM projects p JOIN project_members pm ON p.id=pm.project_id WHERE pm.user_id=$1 ORDER BY p.created_at DESC`;
    const { rows } = await db.query(query, [userId]);
    return rows;
};
const findProjectById = async (projectId) => {
    const query = `SELECT id,name,description,owner_id,created_at,updated_at FROM projects WHERE id=$1`;
    const { rows } = await db.query(query, [projectId]);
    return rows[0] || null;
};
const findProjectMember = async (projectId, userId) => {
    const query = `SELECT role FROM project_members WHERE project_id = $1 AND user_id=$2`;
    const { rows } = await db.query(query, [projectId, userId]);
    return rows[0] || null;
};
const updateProject = async (projectId, { name, description }) => {
    const query = `
        UPDATE projects
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, name, description, owner_id, created_at, updated_at
    `;
    const { rows } = await db.query(query, [name ?? null, description ?? null, projectId]);
    return rows[0] || null;
};
const deleteProject = async (projectId) => {
    const query = `
        DELETE FROM projects
        WHERE id = $1
        RETURNING id
    `;
    const { rows } = await db.query(query, [projectId]);
    return rows[0] || null;
};
module.exports = {
    createProject,
    findProjectByUserId,
    findProjectById,
    findProjectMember,
    updateProject,
    deleteProject,
};
