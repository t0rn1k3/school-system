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
const setTenantModels = require("../../middlewares/setTenantModels");

ModuleRouter.post("/", isLogin, isAdmin, setTenantModels, createModule);
ModuleRouter.get("/", isTeacherOrAdmin, setTenantModels, getModules);
ModuleRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getModule);
ModuleRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateModule);
ModuleRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteModule);

module.exports = ModuleRouter;
