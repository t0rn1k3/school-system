const verifyToken = require("../utils/verifyToken");
const Admin = require("../model/Staff/Admin");
const Teacher = require("../model/Staff/Teacher");

/**
 * Allows either Admin or Teacher to access the route.
 * Use for academic read endpoints (programs, subjects, etc.) that teachers need for exam forms.
 */
const isTeacherOrAdmin = async (req, res, next) => {
  try {
    const headerObj = req.headers;
    const token = headerObj?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. No token provided.",
      });
    }

    const verify = verifyToken(token);
    if (!verify) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Invalid token.",
      });
    }

    // Try Admin first
    const admin = await Admin.findOne({
      _id: verify.id,
      isDeleted: { $ne: true },
    }).select("name email role");

    if (admin) {
      req.userAuth = admin;
      return next();
    }

    // Try Teacher
    const teacher = await Teacher.findOne({
      _id: verify.id,
      isDeleted: { $ne: true },
    }).select("name email role");

    if (teacher) {
      req.userAuth = teacher;
      return next();
    }

    return res.status(401).json({
      status: "failed",
      message: "Access denied. User not found.",
    });
  } catch (error) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Authentication failed.",
      error: error.message,
    });
  }
};

module.exports = isTeacherOrAdmin;
