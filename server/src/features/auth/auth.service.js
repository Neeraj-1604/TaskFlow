const { findUserByEmail, createUser } = require('./auth.repository.js');
const { hashPassword } = require('../../utils/hash.js');
const AppError = require('../../errors/AppError.js');

const registerUser = async ({ name, email, password }) => {
    const existing = await findUserByEmail(email);
    if (existing) {
        throw new AppError('Email already exists', 409);
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, email, passwordHash });
    return user;
}

module.exports = {
    registerUser
};