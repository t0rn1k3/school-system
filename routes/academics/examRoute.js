const express = require("express");
const {
  createExam,
  getExams,
  getExam,
  updateExam,
} = require("../../controller/academic/examsCtrl");
const isTeacherLogin = require("../../middlewares/isTeacherLogin");
const isTeacher = require("../../middlewares/isTeacher");
const setTenantModels = require("../../middlewares/setTenantModels");
const examRouter = express.Router();

examRouter.post("/", isTeacherLogin, isTeacher, setTenantModels, createExam);
examRouter.get("/", isTeacherLogin, isTeacher, setTenantModels, getExams);
examRouter.get("/:id", isTeacherLogin, isTeacher, setTenantModels, getExam);
examRouter.put("/:id", isTeacherLogin, isTeacher, setTenantModels, updateExam);

module.exports = examRouter;
