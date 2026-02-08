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

AcademicTermRouter.post("/", isLogin, isAdmin, createAcademicTerm);
AcademicTermRouter.get("/", isLogin, isAdmin, getAcademicTerms);
AcademicTermRouter.get("/:id", isLogin, isAdmin, getAcademicTerm);
AcademicTermRouter.put("/:id", isLogin, isAdmin, updateAcademicTerm);
AcademicTermRouter.delete("/:id", isLogin, isAdmin, deleteAcademicTerm);
module.exports = AcademicTermRouter;
