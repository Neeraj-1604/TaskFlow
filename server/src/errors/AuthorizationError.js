const AppError = require('./AppError.js');
class AuthorizationError extends AppError {
    constructor(message = "Forbidden: You do not have permission to perform this Action") {
        super(message, 403);
    }
}
module.exports = AuthorizationError;
