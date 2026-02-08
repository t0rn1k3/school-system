const express = require("express");
const morgan = require("morgan");
const {
  globalErrorHandler,
  pageNotFound,
} = require("../middlewares/globalErrorHandler");

const AcademicYearRouter = require("../routes/academics/academicYearRouter");
const AcademicTermRouter = require("../routes/academics/academicTermRouter");
const adminRouter = require("../routes/staff/adminRouter");

const app = express();

//===Middlewares===
// Parse JSON - Express 5 compatible (handles missing Content-Type header)
app.use(
  express.json({
    type: (req) => {
      // Accept JSON if Content-Type is application/json OR if Content-Type is missing/undefined
      const contentType = req.headers["content-type"];
      return (
        contentType === "application/json" ||
        !contentType ||
        contentType === undefined
      );
    },
  }),
);

//Routes

app.use("/api/v1/academic-years", AcademicYearRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/academic-terms", AcademicTermRouter);

// Error Handler
app.use(pageNotFound);

app.use(globalErrorHandler);

module.exports = app;
