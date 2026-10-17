const { z } = require('zod');
const createProjectSchema = z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, { message: 'Project name must be atleast 2 charecters long' })
        .max(100, { message: 'Project name cannot exceed 100 charecters' }),
    description: z.string().trim().max(1000, { message: 'Description cannot exceed 1000 charecters' }).optional(),
}).strict();
const updateProjectSchema = z.object({
    name: z.string().trim().min(2, { message: 'Project name must be atleast 2 charecters long' }).max(100, { message: 'Project name cannot exceed 100 charecters' }).optional(),
    description: z.string().trim().max(1000, { message: 'Description cannot exceed 1000 charecters' }).optional(),
}).strict().refine((data) => data.name !== undefined || data.description !== undefined, {
    message: 'Atleast one field {name or description} must be provided',
});
const projectIdParamSchema = z.object({
    id: z.string({ required_error: 'Project ID is required' }).uuid({ message: 'Invalid Project ID format. Must be a valid uuid' }),
});
module.exports = {
    createProjectSchema,
    updateProjectSchema,
    projectIdParamSchema
}