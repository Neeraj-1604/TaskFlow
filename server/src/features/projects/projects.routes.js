const express = require('express');
const membersRouter = require('../members/members.routes.js');
const {
    create,
    getAll,
    getById,
    update,
    remove,
} = require('./projects.controller.js');
const authenticate = require('../../middleware/authenticate.js');
const validate = require('../../middleware/validate.js');
const {
    createProjectSchema,
    updateProjectSchema,
    projectIdParamSchema,
} = require('./projects.validator.js');
const router = express.Router();
router.use(authenticate);
router.post('/', validate(createProjectSchema), create);
router.get('/', getAll);
router.get('/:id', validate(projectIdParamSchema, 'params'), getById);
router.patch(
    '/:id',
    validate(projectIdParamSchema, 'params'),
    validate(updateProjectSchema),
    update
);
router.delete('/:id', validate(projectIdParamSchema, 'params'), remove);
router.use('/:projectId/members', membersRouter);
module.exports = router;