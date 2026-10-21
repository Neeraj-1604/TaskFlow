const {
    createTask,
    findTaskById,
    findTasksByProjectId,
    updateTask,
    deleteTask,
} = require('./tasks.repository.js');
const { findProjectMember } = require('../projects/projects.repository.js');
const { getPaginationParams, buildPaginationResponse } = require('../../utils/pagination.js');
const NotFoundError = require('../../errors/NotFoundError.js');
const AuthorizationError = require('../../errors/AuthorizationError.js');
const AppError = require('../../errors/AppError.js');

const createNewTask = async ({ projectId, creatorId, ...taskData }) => {
    if (taskData.assigneeId) {
        const isMember = await findProjectMember(projectId, taskData.assigneeId);
        if (!isMember) {
            throw new AppError('Assignee must be a member of this project', 400);
        }
    }
    const task = await createTask({
        projectId,
        creatorId,
        ...taskData,
    });
    return task;
};

const getTaskDetails = async (projectId, taskId) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    return task;
};

const getProjectTasks = async (projectId, query = {}) => {
    const { page = 1, limit = 10, status, priority, assigneeId, search, sortBy, sortOrder } = query;
    const { offset, limit: parsedLimit, page: parsedPage } = getPaginationParams(page, limit);

    const { tasks, totalItems } = await findTasksByProjectId(projectId, {
        status,
        priority,
        assigneeId,
        search,
        sortBy,
        sortOrder,
        limit: parsedLimit,
        offset,
    });

    const pagination = buildPaginationResponse(totalItems, parsedPage, parsedLimit);
    return { tasks, pagination };
};

const updateTaskDetails = async (projectId, taskId, updateData) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    if (updateData.assigneeId) {
        const isMember = await findProjectMember(projectId, updateData.assigneeId);
        if (!isMember) {
            throw new AppError('Assignee must be a member of this project', 400);
        }
    }
    const updatedTask = await updateTask(taskId, updateData);
    return updatedTask;
};

const deleteTaskById = async (projectId, taskId, userId) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    const member = await findProjectMember(projectId, userId);
    if (!member) {
        throw new AuthorizationError('You are not a member of this project');
    }
    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
    const isCreator = task.creatorId === userId;
    if (!isOwnerOrAdmin && !isCreator) {
        throw new AuthorizationError('You do not have permission to delete this task');
    }
    await deleteTask(taskId);
    return { id: taskId };
};

module.exports = {
    createNewTask,
    getTaskDetails,
    getProjectTasks,
    updateTaskDetails,
    deleteTaskById,
};
