const asyncHandler = require('../../utils/asyncHandler.js');
const apiResponse = require('../../utils/apiResponse.js');
const { registerUser, loginUser } = require('./auth.service.js');
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
    const response = new apiResponse(200, { user, accesToken: tokens.accessToken }, 'Login succesfull');
    res.status(response.statusCode).json(response);
});
const logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    const response = new apiResponse(200, {}, 'Logout successful');

});

module.exports = {
    register,
    login, logout
}