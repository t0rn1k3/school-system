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
teacherRouter.get("/:teacherId/admin", isLogin, isAdmin, getSingleTeacherCtrl);
// Teacher updates own profile
teacherRouter.put("/profile", isTeacherLogin, isTeacher, updateTeacherProfileCtrl);
// Admin updates specific teacher
teacherRouter.put("/:teacherId", isLogin, isAdmin, adminUpdateTeacher);
module.exports = teacherRouter;
