const AppError = require('./AppError.js');

class NotFoundError extends AppError {
    constructor(message = "Resource Not Found") {
        super(message, 401);
    }
}
module.exports = NotFoundError;