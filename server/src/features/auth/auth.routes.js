const express = require('express');
const { register, login, logout } = require('./auth.controller.js');
const validate = require('../../middleware/validate.js');
const { registerSchema, loginSchema } = require('./auth.validator.js');

const router = express.Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

module.exports = router;