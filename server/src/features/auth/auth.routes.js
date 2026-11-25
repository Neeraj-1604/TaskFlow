const express = require('express');
const { register, login, logout, getMe, refresh } = require('./auth.controller.js');
const validate = require('../../middleware/validate.js');
const { registerSchema, loginSchema } = require('./auth.validator.js');
const authenticate = require('../../middleware/authenticate.js');
const { authLimiter } = require('../../middleware/rateLimiter.js');

const router = express.Router();
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/refresh', refresh);

module.exports = router;