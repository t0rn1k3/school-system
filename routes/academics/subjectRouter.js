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

SubjectRouter.post("/:programId", isLogin, isAdmin, createSubject);
SubjectRouter.get("/", isTeacherOrAdmin, getSubjects);
SubjectRouter.get("/:id", isTeacherOrAdmin, getSubject);
SubjectRouter.put("/:id", isLogin, isAdmin, updateSubject);
SubjectRouter.delete("/:id", isLogin, isAdmin, deleteSubject);
module.exports = SubjectRouter;
