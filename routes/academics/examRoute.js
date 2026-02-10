const express = require("express");
const {
  createExam,
  getExams,
  getExam,
  updateExam,
} = require("../../controller/academic/examsCtrl");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const examRouter = express.Router();

examRouter.post("/", isTeacherLogin, isTeacher, createExam);
examRouter.get("/", isTeacherLogin, isTeacher, getExams);
examRouter.get("/:id", isTeacherLogin, isTeacher, getExam);
examRouter.put("/:id", isTeacherLogin, isTeacher, updateExam);

module.exports = examRouter;
