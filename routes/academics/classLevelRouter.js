const express = require("express");
const {
  createClassLevel,
  getClassLevels,
  getClassLevel,
  updateClassLevel,
  deleteClassLevel,
} = require("../../controller/academic/classLevel");
const ClassLevelRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

ClassLevelRouter.post("/", isLogin, isAdmin, setTenantModels, createClassLevel);
ClassLevelRouter.get("/", isTeacherOrAdmin, setTenantModels, getClassLevels);
ClassLevelRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getClassLevel);
ClassLevelRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateClassLevel);
ClassLevelRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteClassLevel);
module.exports = ClassLevelRouter;
