const express = require("express");
const {
  createYearGroup,
  getYearGroups,
  getYearGroup,
  updateYearGroup,
  deleteYearGroup,
} = require("../../controller/academic/yearGroups");
const YearGroupRouter = express.Router();
const isAdmin = require("../../middlewares/isAdmin");
const isLogin = require("../../middlewares/isLogin");
const isTeacherOrAdmin = require("../../middlewares/isTeacherOrAdmin");
const setTenantModels = require("../../middlewares/setTenantModels");

YearGroupRouter.post("/", isLogin, isAdmin, setTenantModels, createYearGroup);
YearGroupRouter.get("/", isTeacherOrAdmin, setTenantModels, getYearGroups);
YearGroupRouter.get("/:id", isTeacherOrAdmin, setTenantModels, getYearGroup);
YearGroupRouter.put("/:id", isLogin, isAdmin, setTenantModels, updateYearGroup);
YearGroupRouter.delete("/:id", isLogin, isAdmin, setTenantModels, deleteYearGroup);
module.exports = YearGroupRouter;
