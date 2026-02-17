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

YearGroupRouter.post("/", isLogin, isAdmin, createYearGroup);
YearGroupRouter.get("/", isTeacherOrAdmin, getYearGroups);
YearGroupRouter.get("/:id", isTeacherOrAdmin, getYearGroup);
YearGroupRouter.put("/:id", isLogin, isAdmin, updateYearGroup);
YearGroupRouter.delete("/:id", isLogin, isAdmin, deleteYearGroup);
module.exports = YearGroupRouter;
