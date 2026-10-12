const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        status: err.status,
        message: err.message,
        errors: err.errors || [],
        stack: err.stack
    })
}
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors || [],
            status: err.status,
        });
    } else {
        console.error('UNEXPECTED SYSTEM ERROR:', err);
        res.status(500).json({
            success: false,
            statusCode: 500,
            status: "error",
            message: "Something went wrong"
        });
    }
};
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'development') {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

module.exports = errorHandler;