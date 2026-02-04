const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const generateToken = require("../../utils/generateToken");
const verifyToken = require("../../utils/verifyToken");

//@desc Register admin
//@route POST  api/v1/admins/register
//@acess Private

exports.registerAdminCtrl = AsyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  // Check if user already exists
  const existingUser = await Admin.findOne({ 
    email: email.toLowerCase().trim() 
  });
  
  if (existingUser) {
    return res.status(409).json({
      message: "User with this email already exists"
    });
  }

  // Register user (email stored in lowercase)
  const user = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    password,
  });
  
  res.status(201).json({
    status: "success",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

//@desc Login admin
//@route POST  api/v1/admins/login
//@acess Private

exports.loginAdminCtrl = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({email});
  if(!user){
    return res.json({message : "Invalid ligin crendentials"})
  }
 
  if(user && (await user.verifyPassword(password))){
    const token =  generateToken(user._id);
   
    const verify = verifyToken(token);
  
    return res.json({data:generateToken(user._id), user, verify})
  }else {
    return res.json({message : "Invalid ligin crendentials"})
  }
});

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
    console.log(req.userAuth);
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
