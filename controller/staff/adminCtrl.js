const Admin = require("../../model/Staff/Admin");

//@desc Register admin
//@route POST  api/v1/admins/register
//@acess Private

exports.registerAdminCtrl = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    // if (adminExists) {
    //   res.json("Admin exists");
    // }

    //register
    const user = await Admin.create({
      name,
      email,
      password,
    });
    res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc Login admin
//@route POST  api/v1/admins/login
//@acess Private

exports.loginAdminCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Admin has logged in",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc all admins
//@route GET  api/v1/admins
//@acess Private

exports.getAdminsCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "All admins",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc single admin
//@route GET  api/v1/admins/:id
//@acess Private

exports.getAdminCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Single admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc update admin
//@route PUT  api/v1/admins/:id
//@acess Private

exports.updateAdminCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Update admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc delete admin
//@route DELETE  api/v1/admins/:id
//@acess Private

exports.deleteAdminCTRL = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Delete admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc suspend teacher
//@route PUT  api/v1/admins/suspend/teacher/:id
//@acess Private

exports.adminSuspendTeacherCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin suspended teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc unsuspend teacher
//@route PUT  api/v1/admins/unsuspend/teacher/:id
//@acess Private

exports.adminUnsupendTeacherCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "success",
      data: " admin unsuspended teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc withdraw teacher
//@route PUT  api/v1/admins/withdraw/teacher/:id
//@acess Private

exports.adminWithdrawTeacherCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin withdrawed teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc unwithdraw teacher
//@route PUT  api/v1/admins/unwithdraw/teacher/:id
//@acess Private

exports.adminUnwithdrawTeacherCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unwithdrawed teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc publish exam
//@route PUT  api/v1/admins/publish/exam/:id
//@acess Private

exports.adminPublishExamCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin published teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc unpublish exam
//@route PUT  api/v1/admins/unpublish/exam/:id
//@acess Private

exports.adminUnpublishExamCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unpublished teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};
