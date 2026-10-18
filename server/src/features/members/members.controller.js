const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');

const { getProjectMembers, inviteMember, changeMemberRole, removeMember } = require('./members.service.js');
const listMembers = asyncHandler(async (req, res) => {
    const members = await getProjectMembers(req.params.projectId);
    const response = new apiResponse(200, members, 'Project members fetched successfully');
    res.status(response.statusCode).json(response);
});
const addMember = asyncHandler(async (req, res) => {
    const member = await inviteMember(req.params.projectId, req.user.id, req.body);
    const response = new apiResponse(201, member, 'Member added to the project successfully');
    res.status(response.statusCode).json(response);
});
const updateRole = asyncHandler(async (req, res) => {
    const updated = await changeMemberRole(
        req.params.projectId,
        req.user.id,
        req.params.userId,
        req.body.role,
    );
    const response = new apiResponse(200, updated, 'Member role updated successfully');
    res.status(response.statusCode).json(response);
});
const remove = asyncHandler(async (req, res) => {
    const removed = await removeMember(
        req.params.projectId,
        req.user.id,
        req.params.userId,
    );
    const response = new apiResponse(200, removed, 'Member removed successfully');
    res.status(response.statusCode).json(response);
});
module.exports = { listMembers, addMember, updateRole, remove };