const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const {
    createNewProject,
    getUserProjects,
    getProjectDetails,
    updateProjectDetails,
    deleteProjectById,
} = require('./projects.service.js');
const create = asyncHandler(async (req, res) => {
    const { name, description } = req.bodyl
    const project = await createNewProject({
        name, description, userId: req.user.id
    });
    const response = new apiResponse(201, project, "Project created successfully");
    res.status(response.statusCode).json(response);
});
const getAll = asyncHandler(async (req, res) => {
    const projects = await getUserProjects(req.user.id);
    const response = new apiResponse(200, projects, 'Projects fetched successfully');
    res.status(response.statusCode).json(response);
});
const getById = asyncHandler(async (req, res) => {
    const project = await getProjectDetails(req.params.id, req.user.id);
    const response = new apiResponse(200, project, 'Project Fetched successfully');
    res.status(response.statusCode).json(response);
});
const update = asyncHandler(async (req, res) => {
    const project = await updateProjectDetails(req.params.id, req.user.id, req.body);
    const response = new apiResponse(200, project, "Project Updated Successfully");
    res.status(response.statusCode).json(response);
});
const remove = asyncHandler(async (req, res) => {
    await deleteProjectById(req.params.id, req.user.id);
    const response = new apiResponse(200, {}, "Project Deleted Successfully");
    res.status(response.statusCode).json(response);
});
module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
}