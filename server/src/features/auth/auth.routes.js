const express = require('express');
const { register } = require('./auth.controller.js');
const validate = require('../../middleware/validate.js');
const { registerSchema } = require('./auth.validator.js');

const router = express.Router();
router.post('/register', validate(registerSchema), register);

module.exports = router;
