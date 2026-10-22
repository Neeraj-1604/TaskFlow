const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const {
    createNewTask,
    getTaskDetails,
    getProjectTasks,
    updateTaskDetails,
    deleteTaskById,
} = require('./tasks.service.js');
const createTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const creatorId = req.user.id;

    const task = await createNewTask({
        projectId,
        creatorId,
        ...req.body,
    });

    const response = new apiResponse(201, task, 'Task created successfully');
    res.status(response.statusCode).json(response);
});
const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const result = await getProjectTasks(projectId, req.query);

    const response = new apiResponse(200, result, 'Tasks fetched successfully');
    res.status(response.statusCode).json(response);
});


const getTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const task = await getTaskDetails(projectId, taskId);

    const response = new apiResponse(200, task, 'Task fetched successfully');
    res.status(response.statusCode).json(response);
});

const updateTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const updatedTask = await updateTaskDetails(projectId, taskId, req.body);

    const response = new apiResponse(200, updatedTask, 'Task updated successfully');
    res.status(response.statusCode).json(response);
});
const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;

    const result = await deleteTaskById(projectId, taskId, userId);

    const response = new apiResponse(200, result, 'Task deleted successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
};
