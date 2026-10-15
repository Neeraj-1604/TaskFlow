const ValidationError = require('../errors/ValidationError.js');

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return next(new ValidationError(result.error));
        }
        req[source] = result.data;
        next();
    };
};
module.exports = validate;
