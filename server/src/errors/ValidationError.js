const AppError = require('./AppError.js');

class ValidationError extends AppError {
    constructor(zodError) {
        const formattedErrors = zodError.issues.map((err) => {
            return {
                field: err.path.join('.'),
                message: err.message
            };
        });
        super('Validation failed', 400, formattedErrors);
    }
}
module.exports = ValidationError;
