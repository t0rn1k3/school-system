const express = require("express");
const morgan = require("morgan");
const {
  globalErrorHandler,
  pageNotFound,
} = require("../middlewares/globalErrorHandler");

const AcademicYearRouter = require("../routes/academics/academicYearRouter");
const AcademicTermRouter = require("../routes/academics/academicTermRouter");
const adminRouter = require("../routes/staff/adminRouter");
const ClassLevelRouter = require("../routes/academics/classLevelRouter");
const ProgramRouter = require("../routes/academics/programRouter");
const SubjectRouter = require("../routes/academics/subjectRouter");
const YearGroupRouter = require("../routes/academics/yearGroupsRouter");

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
app.use("/api/v1/class-levels", ClassLevelRouter);
app.use("/api/v1/programs", ProgramRouter);
app.use("/api/v1/subjects", SubjectRouter);
app.use("/api/v1/year-groups", YearGroupRouter);
// Error Handler
app.use(pageNotFound);

app.use(globalErrorHandler);

module.exports = app;
