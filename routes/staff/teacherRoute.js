const express = require("express");

const teacherRouter = express.Router();
const {
  adminRegisterTeacherCtrl,
} = require("../../controller/staff/teachersCtrl");
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const { teacherLoginCtrl } = require("../../controller/staff/teachersCtrl");

teacherRouter.post(
  "/admin/register",
  isLogin,
  isAdmin,
  adminRegisterTeacherCtrl,
);

teacherRouter.post("/login", teacherLoginCtrl);

module.exports = teacherRouter;
