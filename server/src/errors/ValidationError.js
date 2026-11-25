const AppError = require('./AppError.js');

class ValidationError extends AppError {
    constructor(zodError) {
        // Zod errors carry `issues`; callers may also pass a plain message
        // for business-rule validation (e.g. "please provide a file").
        if (typeof zodError === 'string') {
            super(zodError, 400);
            return;
        }

        const formattedErrors = (zodError && zodError.issues ? zodError.issues : []).map((err) => {
            return {
                field: err.path.join('.'),
                message: err.message,
            };
        });

        super('Validation failed', 400, formattedErrors);
    }
}

module.exports = ValidationError;
