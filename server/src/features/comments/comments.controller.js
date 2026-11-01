const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const {
    createNewComment,
    getTaskComments,
    updateCommentContent,
    deleteCommentById,
} = require('./comments.service.js');

const createComment = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const comment = await createNewComment({
        projectId,
        taskId,
        userId,
        content,
    });

    const response = new apiResponse(201, comment, 'Comment added successfully');
    res.status(response.statusCode).json(response);
});

const getComments = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const comments = await getTaskComments(projectId, taskId);

    const response = new apiResponse(200, comments, 'Comments fetched successfully');
    res.status(response.statusCode).json(response);
});

const updateComment = asyncHandler(async (req, res) => {
    const { projectId, taskId, commentId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const updatedComment = await updateCommentContent({
        projectId,
        taskId,
        commentId,
        userId,
        content,
    });

    const response = new apiResponse(200, updatedComment, 'Comment updated successfully');
    res.status(response.statusCode).json(response);
});

const deleteComment = asyncHandler(async (req, res) => {
    const { projectId, taskId, commentId } = req.params;
    const userId = req.user.id;

    const result = await deleteCommentById({
        projectId,
        taskId,
        commentId,
        userId,
    });

    const response = new apiResponse(200, result, 'Comment deleted successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    createComment,
    getComments,
    updateComment,
    deleteComment,
};
