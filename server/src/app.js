const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const db = require('./config/db.js');
const env = require('./config/env.js');
const logger = require('./config/logger.js');
const morganMiddleware = require('./config/morgan.js');
const { swaggerUi, swaggerDocument } = require('./config/swagger.js');
const { generalLimiter } = require('./middleware/rateLimiter.js');
const notFound = require('./middleware/notFound.js');
const errorHandler = require('./middleware/errorHandler.js');
const authRouter = require('./features/auth/auth.routes.js');
const projectsRouter = require('./features/projects/projects.routes.js');

const app = express();

// Do not advertise the framework in responses.
app.disable('x-powered-by');

// Security headers. CSP is relaxed just enough for Swagger UI's inline
// assets; tighten it further once the client is served from a known origin.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
            },
        },
    })
);

// CORS is configurable through CORS_ORIGIN (comma-separated list or `*`).
// `origin: true` reflects the request origin, which works with cookies.
app.use(
    cors({
        origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((origin) => origin.trim()),
        credentials: true,
    })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(morganMiddleware);
app.use(generalLimiter);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (req, res) => res.json(swaggerDocument));

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({
            status: 'success',
            message: 'Taskflow API is running',
        });
    } catch (err) {
        logger.error('Database ping failed', err);
        res.status(503).json({
            status: 'error',
            message: 'database down',
        });
    }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectsRouter);

// Unknown routes go through the same error envelope as everything else.
app.use(notFound);

app.use(errorHandler);

module.exports = app;
