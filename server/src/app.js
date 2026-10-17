const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./config/db.js');
const errorHandler = require('./middleware/errorHandler.js');
const projectsRouter = require('./features/projects/projects.routes.js');
const AppError = require('./errors/AppError.js');
const authRouter = require('./features/auth/auth.routes.js');
const app = express()
app.use(express.json());
app.use(cookieParser());
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      status: "success",
      message: "Taskflow API is running"
    });
  } catch (err) {
    console.error("database ping failed", err);
    res.status(503).json({
      status: "error",
      message: "database down"
    });
  }
});
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectsRouter);
app.all('*', (req, res, next) => {
  next(new AppError('Cannot find the requested URL', 404));
});

app.use(errorHandler);
module.exports = app;