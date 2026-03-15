const express = require("express");
const {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} = require("../../controller/academic/subjects");
const SubjectRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

SubjectRouter.post("/:programId", isLogin, isAdmin, setTenantModels, createSubject);
SubjectRouter.get("/", isTeacherOrAdmin, setTenantModels, getSubjects);
SubjectRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getSubject);
SubjectRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateSubject);
SubjectRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteSubject);
module.exports = SubjectRouter;
