const express = require("express");

const studentRouter = express.Router();

const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isStudentLogin = require("../../middlewares/isStudentLogin");
const isStudent = require("../../middlewares/isStudent");
const setTenantModels = require("../../middlewares/setTenantModels");
const {
  adminRegisterStudentCtrl,
  studentLoginCtrl,
  getStudentProfileCtrl,
  getStudentsCtrl,
  getSingleStudentCtrl,
  updateStudentProfileCtrl,
  adminUpdateStudent,
  studentWriteExamCtrl,
  getStudentExamsCtrl,
  getStudentExamCtrl,
  submitProjectCtrl,
  getGraduationStatusCtrl,
} = require("../../controller/students/studentsCtrl");
const uploadExamSubmission = require("../../middlewares/uploadExamSubmission");

studentRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  setTenantModels,
  adminRegisterStudentCtrl,
);

studentRouter.post("/login", studentLoginCtrl);
studentRouter.get("/profile", isStudentLogin, isStudent, setTenantModels, getStudentProfileCtrl);
studentRouter.get("/", isLogin, isAdmin, setTenantModels, getStudentsCtrl);
studentRouter.get("/admin", isLogin, isAdmin, setTenantModels, getStudentsCtrl);
studentRouter.get("/:studentId/admin", isLogin, isAdmin, setTenantModels, getSingleStudentCtrl);
studentRouter.get(
  "/:studentId/graduation-status",
  isLogin,
  setTenantModels,
  getGraduationStatusCtrl,
);
studentRouter.get("/exams", isStudentLogin, isStudent, setTenantModels, getStudentExamsCtrl);
studentRouter.get("/exams/:examId", isStudentLogin, isStudent, setTenantModels, getStudentExamCtrl);
studentRouter.post(
  "/exams/:examId",
  isStudentLogin,
  isStudent,
  setTenantModels,
  studentWriteExamCtrl,
);
studentRouter.post(
  "/exams/:examId/submit-project",
  isStudentLogin,
  isStudent,
  setTenantModels,
  uploadExamSubmission,
  submitProjectCtrl,
);
studentRouter.put(
  "/profile",
  isStudentLogin,
  isStudent,
  setTenantModels,
  updateStudentProfileCtrl,
);
studentRouter.put("/:studentId/admin", isLogin, isAdmin, setTenantModels, adminUpdateStudent);
module.exports = studentRouter;
