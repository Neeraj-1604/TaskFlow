const {
    createProject,
    findProjectByUserId,
    findProjectById,
    findProjectMember,
    updateProject,
    deleteProject,
} = require('./projects.repository.js');
const NotFoundError = require('../../errors/NotFoundError.js');
const AuthorizationError = require('../../errors/AuthorizationError.js');

const createNewProject = async ({ name, description, userId }) => {
    return await createProject({ name, description, userId });
};
const getUserProjects = async (userId) => {
    return await findProjectByUserId(userId);
};
const getProjectDetails = async (projectId, userId) => {
    const member = await findProjectMember(projectId, userId);
    if (!member) {
        const projectExists = await findProjectById(projectId);
        if (!projectExists) {
            throw new NotFoundError('Project not found');
        }
        throw new AuthorizationError('User is not a member of this project');
    }
    const project = await findProjectById(projectId);
    return { ...project, currentUserRole: member.role };
};
const updateProjectDetails = async (projectId, userId, updateData) => {
    const member = await findProjectMember(projectId, userId);
    if (!member) {
        const projectExists = await findProjectById(projectId);
        if (!projectExists) {
            throw new NotFoundError('Project not found');
        }
        throw new AuthorizationError('You do not have access to this project');
    }
    if (member.role !== 'owner' && member.role !== 'admin') {
        throw new AuthorizationError('You do not have permission to update this project');
    }
    const updated = await updateProject(projectId, updateData);
    return updated;
};
const deleteProjectById = async (projectId, userId) => {
    const member = await findProjectMember(projectId, userId);

    if (!member) {
        const projectExists = await findProjectById(projectId);
        if (!projectExists) throw new NotFoundError('Project not found');
        throw new AuthorizationError('User is not a member of this project');
    }
    if (member.role !== 'owner') throw new AuthorizationError('Only owner can delete the project');

    await deleteProject(projectId);
    return { id: projectId };
};

module.exports = { createNewProject, getUserProjects, getProjectDetails, updateProjectDetails, deleteProjectById };