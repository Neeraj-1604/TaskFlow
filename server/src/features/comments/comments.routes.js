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
const router = express.Router({ mergeParams: true });
router.get(
    '/',
    validate(commentParamsSchema, 'params'),
    getComments
);
router.post(
    '/',
    validate(commentParamsSchema, 'params'),
    validate(createCommentSchema),
    createComment
);
router.patch(
    '/:commentId',
    validate(commentParamsSchema, 'params'),
    validate(updateCommentSchema),
    updateComment
);
router.delete(
    '/:commentId',
    validate(commentParamsSchema, 'params'),
    deleteComment
);
module.exports = router;
