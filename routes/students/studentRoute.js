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
module.exports = studentRouter;
