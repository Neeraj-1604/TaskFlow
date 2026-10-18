const {
    findMembersByProjectId,
    findMember,
    addMemberToProject,
    updateMemberRole,
    removeMemberFromProject,
} = require('./members.repository.js');
const { findProjectMember } = require('../projects/projects.repository.js');
const { findUserByEmail } = require('../auth/auth.repository.js');
const NotFoundError = require('../../errors/NotFoundError.js');
const AuthorizationError = require('../../errors/AuthorizationError.js');
const AppError = require('../../errors/AppError.js');
const getProjectMembers = async (projectId) => {
    return await findMembersByProjectId(projectId);
};
const inviteMember = async (projectId, requesterId, { email, role }) => {
    const userToAdd = await findUserByEmail(email);
    if (!userToAdd) {
        throw new NotFoundError('User with this email does not exist. They must register first.');
    }

    const existing = await findMember(projectId, userToAdd.id);
    if (existing) {
        throw new AppError('User is already a member of this project', 409);
    }
    const requester = await findProjectMember(projectId, requesterId);
    if (requester.role === 'admin' && role === 'admin') {
        throw new AuthorizationError('Admins cannot invite other admins. Only the owner can do so.');
    }

    const member = await addMemberToProject(projectId, userToAdd.id, role);
    return {
        ...member,
        name: userToAdd.name,
        email: userToAdd.email,
    };
};
const changeMemberRole = async (projectId, requesterId, targetUserId, newRole) => {
    const requester = await findProjectMember(projectId, requesterId);
    if (requester.role !== 'owner') {
        throw new AuthorizationError('Only the project owner can change member roles');
    }
    const targetMember = await findMember(projectId, targetUserId);
    if (!targetMember) {
        throw new NotFoundError('Member not found in this project');
    }

    if (targetMember.role === 'owner') {
        throw new AppError('Cannot change the role of the project owner', 400);
    }
    return await updateMemberRole(projectId, targetUserId, newRole);
};
const removeMember = async (projectId, requesterId, targetUserId) => {
    const targetMember = await findMember(projectId, targetUserId);
    if (!targetMember) {
        throw new NotFoundError('Member not found in this project');
    }
    if (targetMember.role === 'owner') {
        throw new AppError('The project owner cannot be removed from the project', 400);
    }

    const requester = await findProjectMember(projectId, requesterId);
    const isSelf = requesterId === targetUserId;
    const isOwner = requester.role === 'owner';
    const isAdminKickingMember = requester.role === 'admin' && targetMember.role === 'member';

    if (!isSelf && !isOwner && !isAdminKickingMember) {
        throw new AuthorizationError('You do not have permission to remove this member');
    }

    await removeMemberFromProject(projectId, targetUserId);
    return { message: 'Member removed successfully' };
};

module.exports = {
    getProjectMembers,
    inviteMember,
    changeMemberRole,
    removeMember,
};
