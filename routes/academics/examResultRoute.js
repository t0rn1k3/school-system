const express = require("express");
const isStudentLogin = require("../../middlewares/isStudentLogin");
const isStudent = require("../../middlewares/isStudent");
const isLogin = require("../../middlewares/isLogin");
const isAdmin = require("../../middlewares/isAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

const {
  checkExamResultCtrl,
  getAllExamResultsCtrl,
  adminToggleExamResult,
} = require("../../controller/academic/examResutlCtrl");

const examResultRouter = express.Router();

examResultRouter.get("/:id", isStudentLogin, isStudent, setTenantModels, checkExamResultCtrl);
examResultRouter.get("/", isStudentLogin, isStudent, setTenantModels, getAllExamResultsCtrl);
examResultRouter.put("/:id", isLogin, isAdmin, setTenantModels, adminToggleExamResult);

module.exports = examResultRouter;
