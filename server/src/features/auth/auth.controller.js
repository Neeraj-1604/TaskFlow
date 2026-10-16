const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const { registerUser, loginUser, refreshAccessToken } = require('./auth.service.js');
const { findUserById } = require('./auth.repository.js');
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const register = asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    const response = new apiResponse(201, user, 'User Registered succesfully');
    res.status(response.statusCode).json(response);
})
const login = asyncHandler(async (req, res) => {
    const { user, tokens } = await loginUser(req.body);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    const response = new apiResponse(200, { user, accessToken: tokens.accessToken }, 'Login succesfull');
    res.status(response.statusCode).json(response);
});
const logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    const response = new apiResponse(200, {}, 'Logout successful');
    res.status(response.statusCode).json(response);
});
const getMe = asyncHandler(async (req, res) => {
    const user = await findUserById(req.user.id);
    const response = new apiResponse(200, user, 'Current user profile fetched successfully');
    res.status(response.statusCode).json(response);
});
const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await refreshAccessToken(refreshToken);
    const response = new apiResponse(200, { accessToken }, 'Access Token refreshed successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    register,
    login, logout, getMe, refresh
}