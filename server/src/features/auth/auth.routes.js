const express = require('express');
const { register, login, logout, getMe, refresh } = require('./auth.controller.js');
const validate = require('../../middleware/validate.js');
const { registerSchema, loginSchema } = require('./auth.validator.js');
const authenticate = require('../../middleware/authenticate.js');

const router = express.Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/me', authenticate, getMe);
router.post('/refresh', refresh);

module.exports = router;