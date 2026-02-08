const express = require("express");
const {
  createProgram,
  getPrograms,
  getProgram,
  updateProgram,
  deleteProgram,
} = require("../../controller/academic/programs");
const ProgramRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");

ProgramRouter.post("/", isLogin, isAdmin, createProgram);
ProgramRouter.get("/", isLogin, isAdmin, getPrograms);
ProgramRouter.get("/:id", isLogin, isAdmin, getProgram);
ProgramRouter.put("/:id", isLogin, isAdmin, updateProgram);
ProgramRouter.delete("/:id", isLogin, isAdmin, deleteProgram);
module.exports = ProgramRouter;
