const express = require("express");

const teacherRouter = express.Router();
const {
  adminRegisterTeacherCtrl,
  teacherLoginCtrl,
  getTeachersCtrl,
  getSingleTeacherCtrl,
  getTeacherProfileCtrl,
  updateTeacherProfileCtrl,
} = require("../../controller/staff/teachersCtrl");
const {
  teacherGetExamResultsCtrl,
  teacherGetExamResultCtrl,
  teacherGradeExamResultCtrl,
  teacherPublishExamResultCtrl,
} = require("../../controller/academic/examResutlCtrl");
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const { adminUpdateTeacher } = require("../../controller/staff/teachersCtrl");

teacherRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterTeacherCtrl,
);

teacherRouter.post("/login", teacherLoginCtrl);
teacherRouter.get("/admin", isLogin, isAdmin, getTeachersCtrl);
teacherRouter.get("/profile", isTeacherLogin, isTeacher, getTeacherProfileCtrl);
// Teacher exam results (must be before /:teacherId)
teacherRouter.get(
  "/exam-results",
  isTeacherLogin,
  isTeacher,
  teacherGetExamResultsCtrl,
);
teacherRouter.get(
  "/exam-results/:id",
  isTeacherLogin,
  isTeacher,
  teacherGetExamResultCtrl,
);
teacherRouter.put(
  "/exam-results/:id/grade",
  isTeacherLogin,
  isTeacher,
  teacherGradeExamResultCtrl,
);
teacherRouter.put(
  "/exam-results/:id/publish",
  isTeacherLogin,
  isTeacher,
  teacherPublishExamResultCtrl,
);
teacherRouter.get("/:teacherId/admin", isLogin, isAdmin, getSingleTeacherCtrl);
// Teacher updates own profile
teacherRouter.put("/profile", isTeacherLogin, isTeacher, updateTeacherProfileCtrl);
// Admin updates specific teacher
teacherRouter.put("/:teacherId", isLogin, isAdmin, adminUpdateTeacher);
module.exports = teacherRouter;
