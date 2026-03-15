const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const {
  globalErrorHandler,
  pageNotFound,
} = require("../middlewares/globalErrorHandler");

const AcademicYearRouter = require("../routes/academics/academicYearRouter");
const AcademicTermRouter = require("../routes/academics/academicTermRouter");
const ClassLevelRouter = require("../routes/academics/classLevelRouter");
const ProgramRouter = require("../routes/academics/programRouter");
const ModuleRouter = require("../routes/academics/moduleRouter");
const SubjectRouter = require("../routes/academics/subjectRouter");
const YearGroupRouter = require("../routes/academics/yearGroupsRouter");
const adminRouter = require("../routes/staff/adminRouter");
const teacherRouter = require("../routes/staff/teacherRoute");
const examRouter = require("../routes/academics/examRoute");
const studentRouter = require("../routes/students/studentRoute");
const questionRouter = require("../routes/academics/questionRoute");
const examResultRouter = require("../routes/academics/examResultRoute");
const adminRouterRoutes = require("../routes/staff/adminRouter");

const app = express();

//===Middlewares===
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [
        "https://edum.ge",
        "https://www.edum.ge",
        ...(process.env.NODE_ENV !== "production"
          ? ["http://localhost:3000"]
          : []),
      ];
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// Parse JSON - skip multipart so Multer receives raw body for file uploads
app.use(
  express.json({
    type: (req) => {
      const ct = req.headers["content-type"] || "";
      if (ct.startsWith("multipart/form-data")) return false;
      return ct.startsWith("application/json") || !ct;
    },
  }),
);

//Routes

app.use("/api/v1/academic-years", AcademicYearRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/academic-terms", AcademicTermRouter);
app.use("/api/v1/class-levels", ClassLevelRouter);
app.use("/api/v1/programs", ProgramRouter);
app.use("/api/v1/modules", ModuleRouter);
app.use("/api/v1/subjects", SubjectRouter);
app.use("/api/v1/year-groups", YearGroupRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/exam-results", examResultRouter);
app.use("/api/v1/admin", adminRouterRoutes);

// Error Handler
app.use(pageNotFound);

app.use(globalErrorHandler);

module.exports = app;
