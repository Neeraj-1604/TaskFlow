const { findProjectMember } = require('../features/projects/projects.repository.js');
const AuthorizationError = require('../errors/AuthorizationError.js');
const NotFoundError = require('../errors/NotFoundError.js');

const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.projectId || req.params.id;
            if (!projectId) {
                return next(new AuthorizationError('Project Id is required for authorizaation'));
            }
            const member = await findProjectMember(projectId, req.user.id);
            if (!member) {
                return next(new AuthorizationError('You are not a member of this project'));
            }
            if (!allowedRoles.includes(member.role)) {
                return next(new AuthorizationError(`Access Denied`));
            }
            req.membership = member;
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
module.exports = authorize;