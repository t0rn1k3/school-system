const express = require("express");
const {
  createAcademicYearCtrl,
} = require("../../controller/academic/academicYearCtrl");
const AcademicYearRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

AcademicYearRouter.post("/", isLogin, isAdmin, createAcademicYearCtrl);

module.exports = AcademicYearRouter;
