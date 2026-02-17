const express = require("express");
const {
  createAcademicYear,
  getAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} = require("../../controller/academic/academicYearCtrl");
const AcademicYearRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");

AcademicYearRouter.post("/", isLogin, isAdmin, createAcademicYear);
AcademicYearRouter.get("/", isTeacherOrAdmin, getAcademicYears);
AcademicYearRouter.get("/:id", isTeacherOrAdmin, getAcademicYear);
AcademicYearRouter.put("/:id", isLogin, isAdmin, updateAcademicYear);
AcademicYearRouter.delete("/:id", isLogin, isAdmin, deleteAcademicYear);
module.exports = AcademicYearRouter;
