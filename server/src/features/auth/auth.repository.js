const db = require('../../config/db.js');
const findUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email=$1';
    const { rows } = await db.query(query, [email]);
    return rows[0] || null;
};
const createUser = async ({ name, email, passwordHash }) => {
    const query = `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id,name,email,created_at,updated_at`;
    const { rows } = await db.query(query, [name, email, passwordHash]);
    return rows[0];
};
module.exports = {
    findUserByEmail,
    createUser
};