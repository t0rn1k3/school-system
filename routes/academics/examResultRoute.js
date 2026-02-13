const express = require("express");
const isStudentLogin = require("../../middlewares/isStudentLogin");
const isStudent = require("../../middlewares/isStudent");
const {
  checkExamResultCtrl,
  getAllExamResultsCtrl,
} = require("../../controller/academic/examResutlCtrl");

const examResultRouter = express.Router();

examResultRouter.get("/:id", isStudentLogin, isStudent, checkExamResultCtrl);
examResultRouter.get("/", isStudentLogin, isStudent, getAllExamResultsCtrl);

module.exports = examResultRouter;
