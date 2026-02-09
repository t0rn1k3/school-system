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

YearGroupRouter.post("/", isLogin, isAdmin, createYearGroup);
YearGroupRouter.get("/", isLogin, isAdmin, getYearGroups);
YearGroupRouter.get("/:id", isLogin, isAdmin, getYearGroup);
YearGroupRouter.put("/:id", isLogin, isAdmin, updateYearGroup);
YearGroupRouter.delete("/:id", isLogin, isAdmin, deleteYearGroup);
module.exports = YearGroupRouter;
