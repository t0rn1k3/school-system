const express = require("express");

const teacherRouter = express.Router();
const {
  adminRegisterTeacherCtrl,
} = require("../../controller/staff/teachersCtrl");
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

teacherRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterTeacherCtrl,
);

module.exports = teacherRouter;
