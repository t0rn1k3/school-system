const express = require("express");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const { createQuestion } = require("../../controller/academic/questionCtrl");

const questionRouter = express.Router();

questionRouter.post("/:examId", isTeacherLogin, isTeacher, createQuestion);

module.exports = questionRouter;
