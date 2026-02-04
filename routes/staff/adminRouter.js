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
  adminPublishExamCtrl,
  adminUnpublishExamCtrl,
} = require("../../controller/staff/adminCtrl");
const isLogin = require("../../middlewares/isLogin");
//register

adminRouter.post("/register", registerAdminCtrl);

//login

adminRouter.post("/login", loginAdminCtrl);

//get all

adminRouter.get("/", getAdminsCtrl);

//get single

adminRouter.get("/profile", isLogin, getAdminProfileCtrl);

//update

adminRouter.put("/:id", updateAdminCtrl);

// delete

adminRouter.delete("/:id", deleteAdminCTRL);

// suspend teacher

adminRouter.put("/suspend/teacher/:id", adminSuspendTeacherCtrl);

//unsuspend teacher

adminRouter.put("/unsuspend/teacher/:id", adminUnsupendTeacherCtrl);

// withdraw teacher

adminRouter.put("/withdraw/teacher/:id", adminWithdrawTeacherCtrl);

//unwithdraw teacher

adminRouter.put("/unwithdraw/teacher/:id", adminUnwithdrawTeacherCtrl);

// publish exam

adminRouter.put("/publish/exam/:id", adminPublishExamCtrl);

// unpublish exam

adminRouter.put("/unpublish/exam/:id", adminUnpublishExamCtrl);
module.exports = adminRouter;
