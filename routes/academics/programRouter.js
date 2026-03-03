const express = require("express");
const {
  createProgram,
  getPrograms,
  getProgram,
  getProgramCurriculum,
  updateProgram,
  deleteProgram,
} = require("../../controller/academic/programs");
const ProgramRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");

ProgramRouter.post("/", isLogin, isAdmin, createProgram);
ProgramRouter.get("/", isTeacherOrAdmin, getPrograms);
ProgramRouter.get("/:id/curriculum", isTeacherOrAdmin, getProgramCurriculum);
ProgramRouter.get("/:id", isTeacherOrAdmin, getProgram);
ProgramRouter.put("/:id", isLogin, isAdmin, updateProgram);
ProgramRouter.delete("/:id", isLogin, isAdmin, deleteProgram);
module.exports = ProgramRouter;
