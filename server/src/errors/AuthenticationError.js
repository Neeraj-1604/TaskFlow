const AppError = require('./AppError.js');
class AuthenticationError extends AppError {
    constructor(message = "Invalid email or password") {
        super(message, 401);
    }
}
module.exports = AuthenticationError;

