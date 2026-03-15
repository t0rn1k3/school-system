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
const setTenantModels = require("../../middlewares/setTenantModels");

AcademicYearRouter.post("/", isLogin, isAdmin, setTenantModels, createAcademicYear);
AcademicYearRouter.get("/", isTeacherOrAdmin, setTenantModels, getAcademicYears);
AcademicYearRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getAcademicYear);
AcademicYearRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateAcademicYear);
AcademicYearRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteAcademicYear);
module.exports = AcademicYearRouter;
