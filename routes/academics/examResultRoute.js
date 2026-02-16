const express = require("express");
const isStudentLogin = require("../../middlewares/isStudentLogin");
const isStudent = require("../../middlewares/isStudent");
const isLogin = require("../../middlewares/isLogin");
const isAdmin = require("../../middlewares/isAdmin");

const {
  checkExamResultCtrl,
  getAllExamResultsCtrl,
  adminToggleExamResult,
} = require("../../controller/academic/examResutlCtrl");

const examResultRouter = express.Router();

examResultRouter.get("/:id", isStudentLogin, isStudent, checkExamResultCtrl);
examResultRouter.get("/", isStudentLogin, isStudent, getAllExamResultsCtrl);
examResultRouter.put("/:id", isLogin, isAdmin, adminToggleExamResult);

module.exports = examResultRouter;
