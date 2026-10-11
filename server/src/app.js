const express = require('express');
const db = require('./config/db.js');
const app = express()
app.use(express.json());
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
module.exports = app;