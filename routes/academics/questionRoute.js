const express = require("express");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
} = require("../../controller/academic/questionCtrl");

const questionRouter = express.Router();

questionRouter.get("/", isTeacherLogin, isTeacher, getQuestions);
questionRouter.post("/:examId", isTeacherLogin, isTeacher, createQuestion);
questionRouter.get("/:id", isTeacherLogin, isTeacher, getQuestion);
questionRouter.put("/:id", isTeacherLogin, isTeacher, updateQuestion);

module.exports = questionRouter;
