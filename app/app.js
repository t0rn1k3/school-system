const express = require("express");
const morgan = require("morgan");
const {
  globalErrorHandler,
  pageNotFound,
} = require("../middlewares/globalErrorHandler");

const AcademicYearRouter = require("../routes/academics/academicYearRouter");
const AcademicTermRouter = require("../routes/academics/academicTermRouter");
const ClassLevelRouter = require("../routes/academics/classLevelRouter");
const ProgramRouter = require("../routes/academics/programRouter");
const SubjectRouter = require("../routes/academics/subjectRouter");
const YearGroupRouter = require("../routes/academics/yearGroupsRouter");
const adminRouter = require("../routes/staff/adminRouter");
const teacherRouter = require("../routes/staff/teacherRoute");
const examRouter = require("../routes/academics/examRoute");
const studentRouter = require("../routes/students/studentRoute");
const questionRouter = require("../routes/academics/questionRoute");
const examResultRouter = require("../routes/academics/examResultRoute");

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
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/exam-results", examResultRouter);
// Error Handler
app.use(pageNotFound);

app.use(globalErrorHandler);

module.exports = app;
