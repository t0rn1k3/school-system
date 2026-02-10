const express = require("express");

const studentRouter = express.Router();

const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const {
  adminRegisterStudentCtrl,
} = require("../../controller/students/studentsCtrl");

studentRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterStudentCtrl,
);

module.exports = studentRouter;
