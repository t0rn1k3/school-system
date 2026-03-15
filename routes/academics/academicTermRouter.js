const express = require("express");
const {
  createAcademicTerm,
  getAcademicTerms,
  getAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
} = require("../../controller/academic/academicTermCtrl");
const AcademicTermRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

AcademicTermRouter.post("/", isLogin, isAdmin, setTenantModels, createAcademicTerm);
AcademicTermRouter.get("/", isTeacherOrAdmin, setTenantModels, getAcademicTerms);
AcademicTermRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getAcademicTerm);
AcademicTermRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateAcademicTerm);
AcademicTermRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteAcademicTerm);
module.exports = AcademicTermRouter;
