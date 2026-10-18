const AppError = require('./AppError.js');

class NotFoundError extends AppError {
    constructor(message = "Resource Not Found") {
        super(message, 404);
    }
}
module.exports = NotFoundError;