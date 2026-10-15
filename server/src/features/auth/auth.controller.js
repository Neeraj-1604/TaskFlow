const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const { registerUser } = require('./auth.service.js');
const register = asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    const response = new apiResponse(201, user, 'User Registered succesfully');
    res.status(response.statusCode).json(response);
})

module.exports = {
    register
}