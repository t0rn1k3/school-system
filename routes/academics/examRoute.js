const express = require("express");
const {
  createExam,
  getExams,
  getExam,
} = require("../../controller/academic/examsCtrl");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const examRouter = express.Router();

examRouter.post("/", isTeacherLogin, isTeacher, createExam);
examRouter.get("/", isTeacherLogin, isTeacher, getExams);
examRouter.get("/:id", isTeacherLogin, isTeacher, getExam);

module.exports = examRouter;
