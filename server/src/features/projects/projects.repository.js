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
