const { z } = require('zod');
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const createTaskSchema = z
    .object({
        title: z
            .string({ required_error: 'Title is required' })
            .trim()
            .min(1, { message: 'Title cannot be empty' })
            .max(255, { message: 'Title cannot exceed 255 characters' }),
        description: z
            .string()
            .trim()
            .max(5000, { message: 'Description cannot exceed 5000 characters' })
            .optional(),
        status: z
            .enum(TASK_STATUSES, {
                errorMap: () => ({
                    message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
                }),
            })
            .default('todo'),
        priority: z
            .enum(TASK_PRIORITIES, {
                errorMap: () => ({
                    message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
                }),
            })
            .default('medium'),
        dueDate: z
            .string()
            .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
            .optional()
            .nullable(),
        assigneeId: z
            .string()
            .uuid({ message: 'Invalid Assignee ID format. Must be a valid UUID' })
            .optional()
            .nullable(),
    })
    .strict();
const updateTaskSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, { message: 'Title cannot be empty' })
            .max(255, { message: 'Title cannot exceed 255 characters' })
            .optional(),
        description: z
            .string()
            .trim()
            .max(5000, { message: 'Description cannot exceed 5000 characters' })
            .optional()
            .nullable(),
        status: z
            .enum(TASK_STATUSES, {
                errorMap: () => ({
                    message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
                }),
            })
            .optional(),
        priority: z
            .enum(TASK_PRIORITIES, {
                errorMap: () => ({
                    message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
                }),
            })
            .optional(),
        dueDate: z
            .string()
            .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
            .optional()
            .nullable(),
        assigneeId: z
            .string()
            .uuid({ message: 'Invalid Assignee ID format. Must be a valid UUID' })
            .optional()
            .nullable(),
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        { message: 'At least one field must be provided to update' }
    );
const taskParamsSchema = z
    .object({
        projectId: z
            .string({ required_error: 'Project ID is required' })
            .uuid({ message: 'Invalid Project ID format. Must be a valid UUID' }),
        taskId: z
            .string()
            .uuid({ message: 'Invalid Task ID format. Must be a valid UUID' })
            .optional(),
    });
const taskQuerySchema = z
    .object({
        page: z.coerce
            .number()
            .int({ message: 'Page must be an integer' })
            .positive({ message: 'Page must be greater than 0' })
            .default(1),
        limit: z.coerce
            .number()
            .int({ message: 'Limit must be an integer' })
            .positive({ message: 'Limit must be greater than 0' })
            .max(100, { message: 'Limit cannot exceed 100' })
            .default(10),
        status: z
            .enum(TASK_STATUSES)
            .optional(),
        priority: z
            .enum(TASK_PRIORITIES)
            .optional(),
        assigneeId: z
            .string()
            .uuid({ message: 'Invalid Assignee ID format' })
            .optional(),
        search: z
            .string()
            .trim()
            .max(100)
            .optional(),
        sortBy: z
            .enum(['created_at', 'due_date', 'priority', 'title', 'status'], {
                errorMap: () => ({ message: 'Invalid sort field' }),
            })
            .default('created_at'),
        sortOrder: z
            .enum(['asc', 'desc'], {
                errorMap: () => ({ message: "Sort order must be 'asc' or 'desc'" }),
            })
            .default('desc'),
    });

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    taskParamsSchema,
    taskQuerySchema,
    TASK_STATUSES,
    TASK_PRIORITIES,
};
