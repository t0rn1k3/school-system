const express = require("express");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const {
  createQuestion,
  getQuestions,
  getQuestion,
} = require("../../controller/academic/questionCtrl");

const questionRouter = express.Router();

questionRouter.get("/", isTeacherLogin, isTeacher, getQuestions);
questionRouter.post("/:examId", isTeacherLogin, isTeacher, createQuestion);
questionRouter.get("/:id", isTeacherLogin, isTeacher, getQuestion);

module.exports = questionRouter;
