const express = require("express");
const {
  createAcademicYear,
  getAcademicYears,
  getAcademicYear,
} = require("../../controller/academic/academicYearCtrl");
const AcademicYearRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

AcademicYearRouter.post("/", isLogin, isAdmin, createAcademicYear);
AcademicYearRouter.get("/", isLogin, isAdmin, getAcademicYears);
AcademicYearRouter.get("/:id", isLogin, isAdmin, getAcademicYear);

module.exports = AcademicYearRouter;
