const express = require("express");
const {
  checkExamResultCtrl,
} = require("../../controller/academic/examResutlCtrl");

const examResultRouter = express.Router();

examResultRouter.get("/:id", checkExamResultCtrl);

module.exports = examResultRouter;
