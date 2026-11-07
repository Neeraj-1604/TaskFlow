const {
    createComment,
    findCommentsByTaskId,
    findCommentById,
    updateComment,
    deleteComment,
} = require('./comments.repository.js');
const { findTaskById } = require('../tasks/tasks.repository.js');
const { findProjectMember } = require('../projects/projects.repository.js');
const NotFoundError = require('../../errors/NotFoundError.js');
const AuthorizationError = require('../../errors/AuthorizationError.js');

const createNewComment = async ({ projectId, taskId, userId, content }) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }

    const comment = await createComment({
        taskId,
        userId,
        content,
    });

    return comment;
};

const getTaskComments = async (projectId, taskId) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    const comments = await findCommentsByTaskId(taskId);
    return comments;
};

const updateCommentContent = async ({ projectId, taskId, commentId, userId, content }) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    const comment = await findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) {
        throw new NotFoundError('Comment not found on this task');
    }

    if (comment.userId !== userId) {
        throw new AuthorizationError('You can only edit your own comments');
    }
    const updatedComment = await updateComment(commentId, content);
    return updatedComment;
};

const deleteCommentById = async ({ projectId, taskId, commentId, userId }) => {
    const task = await findTaskById(taskId);
    if (!task || task.projectId !== projectId) {
        throw new NotFoundError('Task not found in this project');
    }
    const comment = await findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) {
        throw new NotFoundError('Comment not found on this task');
    }
    const member = await findProjectMember(projectId, userId);
    if (!member) {
        throw new AuthorizationError('You are not a member of this project');
    }

    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
    const isAuthor = comment.userId === userId;

    if (!isOwnerOrAdmin && !isAuthor) {
        throw new AuthorizationError('You do not have permission to delete this comment');
    }
    await deleteComment(commentId);
    return { id: commentId };
};

module.exports = {
    createNewComment,
    getTaskComments,
    updateCommentContent,
    deleteCommentById,
};
