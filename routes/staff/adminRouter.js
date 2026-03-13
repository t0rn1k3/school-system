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
  adminDownloadProjectCtrl,
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
const setTenantModels = require("../../middlewares/setTenantModels");

//register (no auth - creates new school + admin)
adminRouter.post("/register", registerAdminCtrl);

//login
adminRouter.post("/login", loginAdminCtrl);

//get all (tenant: returns admins from current school DB)
adminRouter.get("/", isLogin, setTenantModels, getAdminsCtrl);

//get single (admin profile - uses tenant DB for populated data)
adminRouter.get("/profile", isLogin, isAdmin, setTenantModels, getAdminProfileCtrl);

adminRouter.get("/exam-results", isLogin, isAdmin, adminGetAllExamResultsCtrl);
adminRouter.get(
  "/exam-results/:id/download",
  isLogin,
  isAdmin,
  adminDownloadProjectCtrl,
);

adminRouter.get("/exams", isLogin, isAdmin, getExams);
adminRouter.get("/exams/:id", isLogin, isAdmin, getExam);

adminRouter.get("/questions", isLogin, isAdmin, getQuestions);
adminRouter.get("/questions/:id", isLogin, isAdmin, getQuestion);
adminRouter.post("/questions/:examId", isLogin, isAdmin, createQuestion);
adminRouter.put("/questions/:id", isLogin, isAdmin, updateQuestion);

//update
adminRouter.put("/", isLogin, isAdmin, setTenantModels, updateAdminCtrl);

// delete

adminRouter.delete("/:id", deleteAdminCTRL);

// suspend teacher (supports /teacher/:id and /teachers/:id)
adminRouter.put("/suspend/teacher/:id", isLogin, isAdmin, adminSuspendTeacherCtrl);
adminRouter.put("/suspend/teachers/:id", isLogin, isAdmin, adminSuspendTeacherCtrl);

//unsuspend teacher
adminRouter.put("/unsuspend/teacher/:id", isLogin, isAdmin, adminUnsupendTeacherCtrl);
adminRouter.put("/unsuspend/teachers/:id", isLogin, isAdmin, adminUnsupendTeacherCtrl);

// withdraw teacher (permanently deletes from database)
// PUT and GET supported (some clients use GET by default)
adminRouter.put("/withdraw/teacher/:id", isLogin, isAdmin, adminWithdrawTeacherCtrl);
adminRouter.get("/withdraw/teacher/:id", isLogin, isAdmin, adminWithdrawTeacherCtrl);
adminRouter.put("/withdraw/teachers/:id", isLogin, isAdmin, adminWithdrawTeacherCtrl);
adminRouter.get("/withdraw/teachers/:id", isLogin, isAdmin, adminWithdrawTeacherCtrl);

//unwithdraw teacher (disabled - withdrawn teachers are deleted)
adminRouter.put(
  "/unwithdraw/teacher/:id",
  isLogin,
  isAdmin,
  adminUnwithdrawTeacherCtrl,
);
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
