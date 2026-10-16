const { findUserByEmail, createUser, findUserById } = require('./auth.repository.js');
const { hashPassword, comparePassword } = require('../../utils/hash.js');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../utils/jwt.js")
const AppError = require('../../errors/AppError.js');
const AuthenticationError = require('../../errors/AuthenticationError.js');
const registerUser = async ({ name, email, password }) => {
    const existing = await findUserByEmail(email);
    if (existing) {
        throw new AppError('Email already exists', 409);
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, email, passwordHash });
    return user;
}
const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new AuthenticationError('Invalid email or password');
    }
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
    }
    const tokenPayload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at,
        },
        tokens: {
            accessToken,
            refreshToken,
        }
    };
};
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AuthenticationError('Refresh token not found');
    }
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    }
    catch (err) {
        throw new AuthenticationError('Invalid or expired refresh token');
    }
    const user = await findUserById(decoded.id);
    if (!user) {
        throw new AuthenticationError('User belonging to this token no lpnger exists');
    }
    const newAccessToken = generateAccessToken({ id: user.id, email: user.email });
    return { accessToken: newAccessToken };

}
module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken
};