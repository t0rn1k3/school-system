const express = require("express");
const { createExam, getExams } = require("../../controller/academic/examsCtrl");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const examRouter = express.Router();

examRouter.post("/", isTeacherLogin, isTeacher, createExam);
examRouter.get("/", isTeacherLogin, isTeacher, getExams);

module.exports = examRouter;
