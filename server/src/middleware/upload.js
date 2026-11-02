const multer = require('multer');
const path = require('path');
const AppError = require('../errors/AppError.js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                'Invalid file type. Only JPEG, PNG, WEBP, GIF, PDF, and TXT files are allowed.',
                400
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
});

const uploadSingle = (fieldName = 'file') => {
    return (req, res, next) => {
        const singleUpload = upload.single(fieldName);
        singleUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(
                        new AppError('File size exceeds the maximum allowed limit of 5MB.', 400)
                    );
                }
                return next(new AppError(err.message, 400));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

module.exports = {
    upload,
    uploadSingle,
    ALLOWED_MIME_TYPES,
};
