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

ClassLevelRouter.post("/", isLogin, isAdmin, createClassLevel);
ClassLevelRouter.get("/", isLogin, isAdmin, getClassLevels);
ClassLevelRouter.get("/:id", isLogin, isAdmin, getClassLevel);
ClassLevelRouter.put("/:id", isLogin, isAdmin, updateClassLevel);
ClassLevelRouter.delete("/:id", isLogin, isAdmin, deleteClassLevel);
module.exports = ClassLevelRouter;
