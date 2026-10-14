const ValidationError = require('../errors/ValidationError.js');

const validate = (schema) => {
    return (req, res, next) => {
        // 1. Validate req.body against the provided Zod schema
        const result = schema.safeParse(req.body);

        // 2. If validation failed, pass our ValidationError to Express error handler
        if (!result.success) {
            return next(new ValidationError(result.error));
        }

        // 3. If validation succeeded, update req.body with cleaned data (trimmed, lowercased, etc.)
        req.body = result.data;
        next();
    };
};

module.exports = validate;
