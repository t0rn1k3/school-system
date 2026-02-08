const express = require("express");
const {
  createAcademicYear,
  getAcademicYears,
  getAcademicYear,
  updateAcademicYear,
} = require("../../controller/academic/academicYearCtrl");
const AcademicYearRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

AcademicYearRouter.post("/", isLogin, isAdmin, createAcademicYear);
AcademicYearRouter.get("/", isLogin, isAdmin, getAcademicYears);
AcademicYearRouter.get("/:id", isLogin, isAdmin, getAcademicYear);
AcademicYearRouter.put("/:id", isLogin, isAdmin, updateAcademicYear);

module.exports = AcademicYearRouter;
