const express = require("express");
const morgan = require("morgan");
const {
  globalErrorHandler,
  pageNotFound,
} = require("../middlewares/globalErrorHandler");

const adminRouter = require("../routes/staff/adminRouter");

const app = express();

//===Middlewares===
app.use(express.json()); // pass incoming json data

//Routes

app.use("/api/v1/admins", adminRouter);

// Error Handler
app.use(pageNotFound);

app.use(globalErrorHandler);

module.exports = app;
