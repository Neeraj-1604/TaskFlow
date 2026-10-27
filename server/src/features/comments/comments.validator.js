const { z } = require('zod');

const createCommentSchema = z
    .object({
        content: z
            .string({ required_error: 'Comment content is required' })
            .trim()
            .min(1, { message: 'Comment content cannot be empty' })
            .max(5000, { message: 'Comment cannot exceed 5000 characters' }),
    })
    .strict();
const updateCommentSchema = z
    .object({
        content: z
            .string({ required_error: 'Comment content is required' })
            .trim()
            .min(1, { message: 'Comment content cannot be empty' })
            .max(5000, { message: 'Comment cannot exceed 5000 characters' }),
    })
    .strict();
const commentParamsSchema = z.object({
    projectId: z
        .string({ required_error: 'Project ID is required' })
        .uuid({ message: 'Invalid Project ID format. Must be a valid UUID' }),
    taskId: z
        .string({ required_error: 'Task ID is required' })
        .uuid({ message: 'Invalid Task ID format. Must be a valid UUID' }),
    commentId: z
        .string()
        .uuid({ message: 'Invalid Comment ID format. Must be a valid UUID' })
        .optional(),
});

module.exports = {
    createCommentSchema,
    updateCommentSchema,
    commentParamsSchema,
};