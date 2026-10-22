const express = require('express');
const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
} = require('./tasks.controller.js');
const authorize = require('../../middleware/authorize.js');
const validate = require('../../middleware/validate.js');
const {
    createTaskSchema,
    updateTaskSchema,
    taskParamsSchema,
    taskQuerySchema,
} = require('./tasks.validator.js');

// mergeParams: true allows this router to access :projectId defined in parent router
const router = express.Router({ mergeParams: true });

// All routes under /:projectId/tasks require the user to be at least a member of the project
router.use(authorize('owner', 'admin', 'member'));

router.get(
    '/',
    validate(taskParamsSchema, 'params'),
    validate(taskQuerySchema, 'query'),
    getTasks
);

router.post(
    '/',
    validate(taskParamsSchema, 'params'),
    validate(createTaskSchema),
    createTask
);

router.get(
    '/:taskId',
    validate(taskParamsSchema, 'params'),
    getTask
);

router.patch(
    '/:taskId',
    validate(taskParamsSchema, 'params'),
    validate(updateTaskSchema),
    updateTask
);

router.delete(
    '/:taskId',
    validate(taskParamsSchema, 'params'),
    deleteTask
);

module.exports = router;
