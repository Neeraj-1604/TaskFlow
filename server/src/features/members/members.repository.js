const db = require('../../config/db.js');
const findMembersByProjectId = async (projectId) => {
    const query = `SELECT u.id,u.name,u.email,pm.role,pm.joined_at 
    FROM project_members pm JOIN users u ON pm.user_id=u.id
    WHERE pm.project_id=$1
    ORDER BY
        CASE pm.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'member' THEN 3
        END,
        pm.joined_at ASC`;
    const { rows } = await db.query(query, [projectId]);
    return rows;
};
const findMember = async (projectId, userId) => {
    const query = `SELECT id, project_id, user_id, role, joined_at FROM project_members WHERE project_id=$1 and user_id=$2`;
    const { rows } = await db.query(query, [projectId, userId]);
    return rows[0] || null;
};
const addMemberToProject = async (projectId, userId, role) => {
    const query = `INSERT INTO project_members (project_id, user_id, role) VALUES($1, $2, $3)
    RETURNING id, project_id, user_id, role, joined_at`;
    const { rows } = await db.query(query, [projectId, userId, role]);
    return rows[0];
};
const updateMemberRole = async (projectId, userId, newRole) => {
    const query = `UPDATE project_members
    SET ROLE=$1
    WHERE project_id=$2 AND user_id=$3
    RETURNING id, project_id, user_id, role, joined_at`;
    const { rows } = await db.query(query, [newRole, projectId, userId]);
    return rows[0] || null;
};
const removeMemberFromProject = async (project_id, user_id) => {
    const query = `DELECT FROM project_members
    WHERE project_id=$1 AND user_id=$2
    RETURNING id`;
    const { rows } = await db.query(query, [projectId, userId]);
    return rows[0] || null;
};
module.exports = {
    findMembersByProjectId,
    findMember,
    addMemberToProject,
    updateMemberRole,
    removeMemberFromProject,
}