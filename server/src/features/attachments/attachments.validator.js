const { z } = require('zod');

const attachmentParamsSchema = z.object({
    projectId: z
        .string({ required_error: 'Project ID is required' })
        .uuid({ message: 'Invalid Project ID format. Must be a valid UUID' }),
    taskId: z
        .string({ required_error: 'Task ID is required' })
        .uuid({ message: 'Invalid Task ID format. Must be a valid UUID' }),
    attachmentId: z
        .string()
        .uuid({ message: 'Invalid Attachment ID format. Must be a valid UUID' })
        .optional(),
});
module.exports = {
    attachmentParamsSchema
}