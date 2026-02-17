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

AcademicTermRouter.post("/", isLogin, isAdmin, createAcademicTerm);
AcademicTermRouter.get("/", isTeacherOrAdmin, getAcademicTerms);
AcademicTermRouter.get("/:id", isTeacherOrAdmin, getAcademicTerm);
AcademicTermRouter.put("/:id", isLogin, isAdmin, updateAcademicTerm);
AcademicTermRouter.delete("/:id", isLogin, isAdmin, deleteAcademicTerm);
module.exports = AcademicTermRouter;
