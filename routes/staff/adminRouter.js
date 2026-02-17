const express = require("express");

const adminRouter = express.Router();

const {
  registerAdminCtrl,
  loginAdminCtrl,
  getAdminsCtrl,
  getAdminProfileCtrl,
  updateAdminCtrl,
  deleteAdminCTRL,
  adminSuspendTeacherCtrl,
  adminUnsupendTeacherCtrl,
  adminWithdrawTeacherCtrl,
  adminUnwithdrawTeacherCtrl,
  adminWithdrawStudentCtrl,
  adminUnwithdrawStudentCtrl,
  adminPublishExamCtrl,
  adminUnpublishExamCtrl,
} = require("../../controller/staff/adminCtrl");
const {
  adminGetAllExamResultsCtrl,
} = require("../../controller/academic/examResutlCtrl");
const { getExams, getExam } = require("../../controller/academic/examsCtrl");
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
} = require("../../controller/academic/questionCtrl");
const isLogin = require("../../middlewares/isLogin");
const isAdmin = require("../../middlewares/isAdmin");
//register

adminRouter.post("/register", registerAdminCtrl);

//login

adminRouter.post("/login", loginAdminCtrl);

//get all

adminRouter.get("/", isLogin, getAdminsCtrl);

//get single

adminRouter.get("/profile", isLogin, isAdmin, getAdminProfileCtrl);

adminRouter.get("/exam-results", isLogin, isAdmin, adminGetAllExamResultsCtrl);

adminRouter.get("/exams", isLogin, isAdmin, getExams);
adminRouter.get("/exams/:id", isLogin, isAdmin, getExam);

adminRouter.get("/questions", isLogin, isAdmin, getQuestions);
adminRouter.get("/questions/:id", isLogin, isAdmin, getQuestion);
adminRouter.post("/questions/:examId", isLogin, isAdmin, createQuestion);
adminRouter.put("/questions/:id", isLogin, isAdmin, updateQuestion);

//update

adminRouter.put("/", isLogin, isAdmin, updateAdminCtrl);

// delete

adminRouter.delete("/:id", deleteAdminCTRL);

// suspend teacher

adminRouter.put("/suspend/teachers/:id", adminSuspendTeacherCtrl);

//unsuspend teacher

adminRouter.put("/unsuspend/teachers/:id", adminUnsupendTeacherCtrl);

// withdraw teacher (permanently deletes from database)

adminRouter.put(
  "/withdraw/teachers/:id",
  isLogin,
  isAdmin,
  adminWithdrawTeacherCtrl,
);

//unwithdraw teacher (disabled - withdrawn teachers are deleted)

adminRouter.put(
  "/unwithdraw/teachers/:id",
  isLogin,
  isAdmin,
  adminUnwithdrawTeacherCtrl,
);

// withdraw student (permanently deletes from database)

adminRouter.put(
  "/withdraw/students/:id",
  isLogin,
  isAdmin,
  adminWithdrawStudentCtrl,
);

// unwithdraw student (disabled - withdrawn students are deleted)

adminRouter.put(
  "/unwithdraw/students/:id",
  isLogin,
  isAdmin,
  adminUnwithdrawStudentCtrl,
);

// publish exam

adminRouter.put("/publish/exam/:id", adminPublishExamCtrl);

// unpublish exam

adminRouter.put("/unpublish/exam/:id", adminUnpublishExamCtrl);
module.exports = adminRouter;
