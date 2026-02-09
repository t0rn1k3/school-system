const express = require("express");

const teacherRouter = express.Router();
const {
  adminRegisterTeacherCtrl,
  teacherLoginCtrl,
  getTeachersCtrl,
  getSingleTeacherCtrl,
} = require("../../controller/staff/teachersCtrl");
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

teacherRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterTeacherCtrl,
);

teacherRouter.post("/login", teacherLoginCtrl);
teacherRouter.get("/admin", isLogin, isAdmin, getTeachersCtrl);
teacherRouter.get("/:teacherId/admin", isLogin, isAdmin, getSingleTeacherCtrl);
module.exports = teacherRouter;
