const express = require("express");

const studentRouter = express.Router();

const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isStudentLogin = require("../../middlewares/isStudentLogin");
const isStudent = require("../../middlewares/isStudent");
const {
  adminRegisterStudentCtrl,
  studentLoginCtrl,
  getStudentProfileCtrl,
  getStudentsCtrl,
  getSingleStudentCtrl,
  updateStudentProfileCtrl,
  adminUpdateStudent,
  studentWriteExamCtrl,
} = require("../../controller/students/studentsCtrl");

studentRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterStudentCtrl,
);

studentRouter.post("/login", studentLoginCtrl);
studentRouter.get("/profile", isStudentLogin, isStudent, getStudentProfileCtrl);
studentRouter.get("/admin", isLogin, isAdmin, getStudentsCtrl);
studentRouter.get("/:studentId/admin", isLogin, isAdmin, getSingleStudentCtrl);
studentRouter.post(
  "/exams/:examId",
  isStudentLogin,
  isStudent,
  studentWriteExamCtrl,
);
// Student updates own profile
studentRouter.put(
  "/profile",
  isStudentLogin,
  isStudent,
  updateStudentProfileCtrl,
);
// Admin updates specific student
studentRouter.put("/:studentId/admin", isLogin, isAdmin, adminUpdateStudent);
module.exports = studentRouter;
