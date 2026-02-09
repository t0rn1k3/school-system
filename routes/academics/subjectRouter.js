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

SubjectRouter.post("/:programId", isLogin, isAdmin, createSubject);
SubjectRouter.get("/", isLogin, isAdmin, getSubjects);
SubjectRouter.get("/:id", isLogin, isAdmin, getSubject);
SubjectRouter.put("/:id", isLogin, isAdmin, updateSubject);
SubjectRouter.delete("/:id", isLogin, isAdmin, deleteSubject);
module.exports = SubjectRouter;
