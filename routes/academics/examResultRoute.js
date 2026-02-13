const express = require("express");
const {
  checkExamResultCtrl,
  getAllExamResultsCtrl,
} = require("../../controller/academic/examResutlCtrl");

const examResultRouter = express.Router();

examResultRouter.get("/:id", checkExamResultCtrl);
examResultRouter.get("/", getAllExamResultsCtrl);

module.exports = examResultRouter;
