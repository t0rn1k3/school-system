const express = require("express");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const {
  createQuestion,
  getQuestions,
} = require("../../controller/academic/questionCtrl");

const questionRouter = express.Router();

questionRouter.get("/", isTeacherLogin, isTeacher, getQuestions);
questionRouter.post("/:examId", isTeacherLogin, isTeacher, createQuestion);

module.exports = questionRouter;
