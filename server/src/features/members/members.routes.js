const express = require('express');
const {
    listMembers,
    addMember,
    updateRole,
    remove,
} = require('./members.controller.js');
const authorize = require('../../middleware/authorize.js');
const validate = require('../../middleware/validate.js');
const {
    addMemberSchema,
    updateMemberRoleSchema,
    memberParamsSchema,
} = require('./members.validator.js');
const router = express.Router({ mergeParams: true });
router.get('/', validate(memberParamsSchema, 'params'),
    authorize('owner', 'admin', 'member'),
    listMembers
);
router.post(
    '/',
    validate(memberParamsSchema, 'params'),
    validate(addMemberSchema),
    authorize('owner', 'admin'),
    addMember
);
router.patch(
    '/:userId',
    validate(memberParamsSchema, 'params'),
    validate(updateMemberRoleSchema),
    authorize('owner'),
    updateRole
);
router.delete(
    '/:userId',
    validate(memberParamsSchema, 'params'),
    authorize('owner', 'admin', 'member'),
    remove
);
module.exports = router;