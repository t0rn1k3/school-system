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
  teacherDownloadProjectCtrl,
  teacherGradeProjectCtrl,
} = require("../../controller/academic/examResutlCtrl");
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const setTenantModels = require("../../middlewares/setTenantModels");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const {
  adminUpdateTeacher,
  withdrawTeacherCtrl,
  getTeacherStudentsCtrl,
} = require("../../controller/staff/teachersCtrl");

teacherRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  setTenantModels,
  adminRegisterTeacherCtrl,
);

teacherRouter.post("/login", teacherLoginCtrl);
teacherRouter.get("/admin", isLogin, isAdmin, setTenantModels, getTeachersCtrl);
teacherRouter.get("/profile", isTeacherLogin, isTeacher, setTenantModels, getTeacherProfileCtrl);
teacherRouter.get(
  "/students",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  getTeacherStudentsCtrl,
);
// Teacher exam results (must be before /:teacherId)
teacherRouter.get(
  "/exam-results",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherGetExamResultsCtrl,
);
teacherRouter.get(
  "/exam-results/:id",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherGetExamResultCtrl,
);
teacherRouter.get(
  "/exam-results/:id/download",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherDownloadProjectCtrl,
);
teacherRouter.put(
  "/exam-results/:id/grade",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherGradeExamResultCtrl,
);
teacherRouter.put(
  "/exam-results/:id/publish",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherPublishExamResultCtrl,
);
teacherRouter.put(
  "/exam-results/:id/grade-project",
  isTeacherLogin,
  isTeacher,
  setTenantModels,
  teacherGradeProjectCtrl,
);
teacherRouter.get("/:teacherId/admin", isLogin, isAdmin, setTenantModels, getSingleTeacherCtrl);
// Teacher updates own profile
teacherRouter.put("/profile", isTeacherLogin, isTeacher, setTenantModels, updateTeacherProfileCtrl);
// Admin withdraw (delete) teacher - DELETE /api/v1/teachers/:teacherId
teacherRouter.delete("/:teacherId", isLogin, isAdmin, setTenantModels, withdrawTeacherCtrl);
// Admin updates specific teacher
teacherRouter.put("/:teacherId", isLogin, isAdmin, setTenantModels, adminUpdateTeacher);
module.exports = teacherRouter;
