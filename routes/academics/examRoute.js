const express = require("express");
const isTeacher = require("../../middlewares/isTeacher");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const { createExam } = require("../../controller/academic/examsCtrl");
const examRouter = express.Router();

examRouter.post("/", isTeacherLogin, isTeacher, createExam);

module.exports = examRouter;
