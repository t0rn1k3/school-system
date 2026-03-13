const express = require("express");
const {
  createProgram,
  getPrograms,
  getProgram,
  getProgramCurriculum,
  downloadCurriculumXls,
  updateProgramCurriculum,
  resetProgramCurriculum,
  updateProgram,
  deleteProgram,
} = require("../../controller/academic/programs");
const ProgramRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

ProgramRouter.post("/", isLogin, isAdmin, setTenantModels, createProgram);
ProgramRouter.get("/", isTeacherOrAdmin, setTenantModels, getPrograms);
ProgramRouter.get("/:id/curriculum", isTeacherOrAdmin, setTenantModels, getProgramCurriculum);
ProgramRouter.get("/:id/curriculum/download", isTeacherOrAdmin, setTenantModels, downloadCurriculumXls);
ProgramRouter.put("/:id/curriculum", isLogin, isAdmin, setTenantModels, updateProgramCurriculum);
ProgramRouter.delete("/:id/curriculum", isLogin, isAdmin, setTenantModels, resetProgramCurriculum);
ProgramRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getProgram);
ProgramRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateProgram);
ProgramRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteProgram);
module.exports = ProgramRouter;
