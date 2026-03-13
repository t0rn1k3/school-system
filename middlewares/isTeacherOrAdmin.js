const verifyToken = require("../utils/verifyToken");
const Admin = require("../model/Staff/Admin");
const Teacher = require("../model/Staff/Teacher");
const TeacherLogin = require("../model/Registry/TeacherLogin");
const { getTenantModels } = require("../utils/tenantConnection");

/**
 * Allows either Admin or Teacher to access the route.
 * Supports database-per-tenant: Admin has schoolDbName; Teacher resolved via TeacherLogin registry.
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

    // Try Admin first (registry DB)
    const admin = await Admin.findOne({
      _id: verify.id,
      isDeleted: { $ne: true },
    }).select("name email role schoolDbName");

    if (admin) {
      req.userAuth = admin;
      return next();
    }

    // Try Teacher: check registry for tenant, then fetch from tenant DB
    const loginEntry = await TeacherLogin.findOne({ teacherId: verify.id });
    if (loginEntry) {
      const models = getTenantModels(loginEntry.schoolDbName);
      const teacher = models && await models.Teacher.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      }).select("name email role");

      if (teacher) {
        req.userAuth = teacher.toObject ? teacher.toObject() : { ...teacher };
        req.userAuth.schoolDbName = loginEntry.schoolDbName;
        req.userAuth._id = teacher._id;
        return next();
      }
    }

    // Fallback: Teacher in default DB (legacy, no tenant)
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
