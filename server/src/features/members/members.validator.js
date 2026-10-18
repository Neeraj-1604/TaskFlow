const { z } = require('zod');
const addMemberSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email({ message: 'Invalid email address format' }),
    role: z.enum(['admin', 'member'], {
        errorMap: () => ({ message: "Role must be either 'admin' or 'member'" }),
    }),
}).strict();
const updateMemberRoleSchema = z.object({
    role: z.enum(['admin', 'member'], {
        errorMap: () => ({ message: "Role must be either 'admin' or 'member'" }),
    }),
}).strict();

const memberParamsSchema = z.object({
    projectId: z
        .string({ required_error: 'Project ID is required' })
        .uuid({ message: 'Invalid Project ID format. Must be a valid UUID' }),
    userId: z
        .string()
        .uuid({ message: 'Invalid User ID format. Must be a valid UUID' })
        .optional(),
});

module.exports = {
    addMemberSchema,
    updateMemberRoleSchema,
    memberParamsSchema,
};
