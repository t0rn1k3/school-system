const express = require("express");
const {
  createModule,
  getModules,
  getModule,
  updateModule,
  deleteModule,
} = require("../../controller/academic/modules");
const ModuleRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");

ModuleRouter.post("/", isLogin, isAdmin, createModule);
ModuleRouter.get("/", isTeacherOrAdmin, getModules);
ModuleRouter.get("/:id", isTeacherOrAdmin, getModule);
ModuleRouter.put("/:id", isLogin, isAdmin, updateModule);
ModuleRouter.delete("/:id", isLogin, isAdmin, deleteModule);

module.exports = ModuleRouter;
