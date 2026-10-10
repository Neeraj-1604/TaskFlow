const express = require('express');
const app = express()
app.use(express.json());


app.get('/health', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Taskflow API is running"
  });
});

module.exports = app;