const express = require('express');
const {
    createComment,
    getComments,
    updateComment,
    deleteComment,
} = require('./comments.controller.js');
const validate = require('../../middleware/validate.js');
const {
    createCommentSchema,
    updateCommentSchema,
    commentParamsSchema,
} = require('./comments.validator.js');

// mergeParams: true allows access to :projectId and :taskId defined in parent routers
const router = express.Router({ mergeParams: true });

// GET /api/v1/projects/:projectId/tasks/:taskId/comments - List all comments on a task
router.get(
    '/',
    validate(commentParamsSchema, 'params'),
    getComments
);

// POST /api/v1/projects/:projectId/tasks/:taskId/comments - Add a new comment
router.post(
    '/',
    validate(commentParamsSchema, 'params'),
    validate(createCommentSchema),
    createComment
);

// PATCH /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId - Update own comment
router.patch(
    '/:commentId',
    validate(commentParamsSchema, 'params'),
    validate(updateCommentSchema),
    updateComment
);

// DELETE /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId - Delete comment
router.delete(
    '/:commentId',
    validate(commentParamsSchema, 'params'),
    deleteComment
);

module.exports = router;
